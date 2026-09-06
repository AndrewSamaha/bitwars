--[[
RAIDER STRATEGY AND CONTROL MODEL

Goals
-----
Raiders should continuously explore the universe, repeatedly inspect stars
where players are likely to operate, share player sightings, and turn those
sightings into a predictable threat. They must do this without entering star
or theta radiation and without becoming trapped in a back-and-forth avoidance
loop. All decisions are deterministic so the authoritative simulation behaves
the same for the same world state.

The controller has three conceptual layers:

  1. Shared strategic knowledge and mission coordination.
  2. A persistent state machine owned by each raider.
  3. Stable, radiation-aware movement toward the current mission destination.

Lua context and command output
------------------------------
`world_tick(ctx)` receives the common universe entities and the owner-wide
`ctx.shared` table. `tick(ctx)` receives one raider as `ctx.self`, visible
combat candidates in `ctx.targets`, the same shared table, and that raider's
exclusive `ctx.private` table. A tick returns either `{ target_id = id }` to
let authoritative combat pursue/attack that entity, or `{ vx, vy }` to set the
raider's desired velocity.

Shared strategic state
----------------------
The neutral map is catalogued once because celestial objects are static. The
host provides this input sorted by entity ID.

  shared.world
      Compact common knowledge for stars, theta, minerals, and planets.

  shared.landmarks / shared.landmark_by_id
      Stars that can receive exploration missions. Stars are the primary
      search locations because players are likely to collect energy there.

  shared.hazards
      Stars and theta with their damage radius plus a safety margin.

  shared.visited[landmark_id]
      Tick when a raider last completed observation and safely departed.

  shared.claims[landmark_id]
      Renewable leases used to spread raiders across different stars. If all
      stars are already claimed, excess raiders are distributed by entity ID
      instead of remaining idle.

  shared.sightings[player_owner_id]
      The latest known entity, position, and tick for each player, plus the
      leased set of raiders assigned to investigate it. Sightings expire after
      LAST_SEEN_SECS and each sighting normally attracts at most
      MAX_HUNTERS_PER_SIGHTING investigators.

  shared.missions[raider_id]
      A debug-friendly summary of current assignments and transitions.

Claims, hunter reservations, and mission summaries are leases. Active raiders
renew their entries; expired entries are removed once per second. This keeps a
destroyed raider from reserving work forever and bounds shared state during a
long-running game.

Per-raider state machine
------------------------
The current mode and its supporting fields live in `ctx.private`, so decisions
survive across ticks instead of being recomputed from scratch.

  travel -> observe -> depart -> travel
      Explore a star, wait at a fixed safe observation point, move farther
      away from it, mark it visited, then request another mission.

  pursue -> investigate -> search
      Attack a visible player, travel to that player's last known position if
      contact is lost, wait briefly for reacquisition, then return to normal
      mission selection.

Visible targets and emergency radiation escape preempt ordinary mission work.
Target identity is retained while visible to prevent target switching when two
player units are at nearly equal distances.

Exploration assignment
----------------------
An idle raider first checks for a fresh player sighting with an available
hunter slot. Otherwise it selects an unclaimed star using this stable order:

  1. Never visited before previously visited.
  2. Oldest completed visit first.
  3. Shortest distance from this raider.
  4. Lowest landmark ID as the final tie-breaker.

The observation point is fixed when the mission is assigned. Sixteen points
around the star's safe perimeter are evaluated against nearby hazards, and the
point with the greatest clearance is retained. This is important when two
stars are close: the controller never deliberately chooses an observation
point that lies inside the neighboring star's radiation field. Observation is
a timed stationary watch rather than a continuously recalculated orbit. After
the watch, the raider follows a fixed radial departure point before the visit
is recorded as complete.

Sightings and response
----------------------
Every visible player refreshes that owner's shared sighting. Raiders already
near the player attack immediately when the direct combat path is safe. Other
raiders, including newly spawned ones, can claim the fresh sighting and travel
to its last known position. On arrival they hold a short search before giving
up, preventing the entire faction from chasing a stale location indefinitely.

Navigation and radiation safety
-------------------------------
Mission destinations and intermediate navigation points are persistent. A
moving target must shift by more than ARRIVAL_RADIUS before its route is
replanned. Each raider also keeps one deterministic left/right detour choice
for its mission. These two rules provide the hysteresis that the former
per-tick tangent-orbit controller lacked.

When a direct segment intersects a hazard, nearby overlapping hazards are
expanded into one conservative cluster and the raider stores a tangent point
around that cluster. It follows that point until arrival instead of switching
between individual stars or theta on alternating ticks. Two expansion passes
cover the small neighboring clusters in the generated universe while keeping
the script inside its instruction quota.

If a raider is already too close to radiation, normal navigation is suspended.
It samples sixteen deterministic escape directions, scores them against only
the hazards close enough to matter, and retains the safest escape target until
it has cleared the outer routing margin. This prevents emergency steering from
flipping direction every tick inside overlapping radiation fields.

Progress recovery and tuning
----------------------------
Navigation records distance to its active point every STUCK_CHECK_SECS. After
repeated checks without meaningful progress, it discards the detour, flips its
detour side, and eventually releases the mission for reassignment. Mode names,
destinations, navigation points, stuck counters, and transition reasons remain
in private/shared state so Lua debug snapshots explain what each raider is
trying to do.

The constants immediately below intentionally collect the behavioral tuning
knobs: sighting lifetime, observation/search durations, lease lifetime,
arrival tolerance, safety clearances, stuck thresholds, and response size.
]]

local LAST_SEEN_SECS = 90
local OBSERVE_SECS = 8
local SEARCH_SECS = 6
local LEASE_SECS = 15
local ARRIVAL_RADIUS = 30
local RADIATION_MARGIN = 100
local OBSERVATION_CLEARANCE = 250
local DEPART_DISTANCE = 500
local ROUTE_MARGIN = 150
local STUCK_CHECK_SECS = 5
local STUCK_PROGRESS = 20
local MAX_STUCK_CHECKS = 3
local MAX_HUNTERS_PER_SIGHTING = 8

local function distance_sq(ax, ay, bx, by)
  local dx = bx - ax
  local dy = by - ay
  return dx * dx + dy * dy
end

local function move_toward(ctx, x, y)
  local dx = x - ctx.self.x
  local dy = y - ctx.self.y
  local distance = math.sqrt(dx * dx + dy * dy)
  if distance <= ARRIVAL_RADIUS then
    return { vx = 0, vy = 0 }
  end
  return { vx = dx / distance * ctx.self.speed, vy = dy / distance * ctx.self.speed }
end

function world_tick(ctx)
  if ctx.shared.landmarks then return end

  local world = {}
  local landmarks = {}
  local landmark_by_id = {}
  local hazards = {}
  for _, entity in ipairs(ctx.entities) do
    local known
    if entity.entity_type_id == "star_yellow" or entity.entity_type_id == "theta"
        or entity.entity_type_id == "minerals" or entity.entity_type_id:match("^planet_") then
      known = {
        id = entity.id,
        entity_type_id = entity.entity_type_id,
        x = entity.x,
        y = entity.y,
        safe_radius = entity.radiation_radius + RADIATION_MARGIN,
      }
      table.insert(world, known)
    end
    if entity.entity_type_id == "star_yellow" then
      table.insert(landmarks, known)
      landmark_by_id[entity.id] = known
      table.insert(hazards, known)
    elseif entity.entity_type_id == "theta" then
      table.insert(hazards, known)
    end
  end
  -- The host supplies universe entities sorted by ID.
  ctx.shared.world = world
  ctx.shared.landmarks = landmarks
  ctx.shared.landmark_by_id = landmark_by_id
  ctx.shared.hazards = hazards
  ctx.shared.visited = {}
  ctx.shared.claims = {}
  ctx.shared.sightings = {}
  ctx.shared.missions = {}
end

local function sync_mission(ctx, reason)
  local private = ctx.private
  ctx.shared.missions[ctx.self.id] = {
    kind = private.mission_kind,
    mode = private.mode,
    target_id = private.mission_target_id,
    owner_id = private.hunt_owner_id,
    x = private.destination_x,
    y = private.destination_y,
    assigned_tick = private.mission_assigned_tick,
    transition_reason = reason,
    expires_tick = ctx.tick + LEASE_SECS * ctx.ticks_per_second,
  }
end

local function set_mode(ctx, mode, reason)
  if ctx.private.mode == mode then return end
  ctx.private.mode = mode
  ctx.private.mode_entered_tick = ctx.tick
  ctx.private.last_transition_reason = reason
  sync_mission(ctx, reason)
end

local function clear_navigation(private)
  private.navigation_x = nil
  private.navigation_y = nil
  private.navigation_goal_x = nil
  private.navigation_goal_y = nil
  private.progress_distance = nil
  private.progress_tick = nil
  private.stuck_checks = 0
end

local function release_mission(ctx)
  local private = ctx.private
  if private.mission_kind == "explore" then
    local claim = ctx.shared.claims[private.mission_target_id]
    if claim and claim.raider_id == ctx.self.id then
      ctx.shared.claims[private.mission_target_id] = nil
    end
  elseif private.hunt_owner_id then
    local sighting = ctx.shared.sightings[private.hunt_owner_id]
    if sighting and sighting.hunters then sighting.hunters[ctx.self.id] = nil end
  end
  ctx.shared.missions[ctx.self.id] = nil
  private.mission_kind = nil
  private.mission_target_id = nil
  private.mission_assigned_tick = nil
  private.hunt_owner_id = nil
  private.destination_x = nil
  private.destination_y = nil
  private.target_entity_id = nil
  private.deadline_tick = nil
  clear_navigation(private)
end

local function count_hunters(ctx, sighting)
  local count = 0
  for raider_id, expires_tick in pairs(sighting.hunters or {}) do
    if expires_tick > ctx.tick then
      count = count + 1
    else
      sighting.hunters[raider_id] = nil
    end
  end
  return count
end

local function assign_hunt(ctx)
  local lifetime = LAST_SEEN_SECS * ctx.ticks_per_second
  local best_owner
  local best
  for owner_id, sighting in pairs(ctx.shared.sightings) do
    if ctx.tick - sighting.tick <= lifetime and count_hunters(ctx, sighting) < MAX_HUNTERS_PER_SIGHTING
        and (not best or sighting.tick > best.tick
          or (sighting.tick == best.tick and owner_id < best_owner)) then
      best_owner = owner_id
      best = sighting
    end
  end
  if not best then return false end

  best.hunters = best.hunters or {}
  best.hunters[ctx.self.id] = ctx.tick + LEASE_SECS * ctx.ticks_per_second
  local private = ctx.private
  private.mission_kind = "hunt"
  private.hunt_owner_id = best_owner
  private.destination_x = best.x
  private.destination_y = best.y
  private.mission_assigned_tick = ctx.tick
  private.detour_direction = ctx.self.id % 2 == 0 and 1 or -1
  set_mode(ctx, "investigate", "fresh shared sighting")
  return true
end

local function observation_point(ctx, landmark)
  local nearby = {}
  local observation_radius = landmark.safe_radius + OBSERVATION_CLEARANCE
  for _, hazard in ipairs(ctx.shared.hazards or {}) do
    local reach = observation_radius + hazard.safe_radius + OBSERVATION_CLEARANCE
    if hazard.id ~= landmark.id
        and distance_sq(landmark.x, landmark.y, hazard.x, hazard.y) < reach * reach then
      table.insert(nearby, hazard)
    end
  end

  local base_angle = math.atan(ctx.self.y - landmark.y, ctx.self.x - landmark.x)
  local best_x, best_y, best_clearance
  for index = 0, 15 do
    local angle = base_angle + index * math.pi / 8
    local x = landmark.x + math.cos(angle) * observation_radius
    local y = landmark.y + math.sin(angle) * observation_radius
    local clearance = math.huge
    for _, hazard in ipairs(nearby) do
      clearance = math.min(clearance,
        math.sqrt(distance_sq(x, y, hazard.x, hazard.y)) - hazard.safe_radius)
    end
    if not best_clearance or clearance > best_clearance then
      best_x, best_y, best_clearance = x, y, clearance
    end
  end
  return best_x, best_y
end

local function assign_explore(ctx)
  local landmarks = ctx.shared.landmarks
  if not landmarks or #landmarks == 0 then return false end

  local best
  local best_visit
  local best_distance
  for _, landmark in ipairs(landmarks) do
    local claim = ctx.shared.claims[landmark.id]
    if not claim or claim.expires_tick <= ctx.tick then
      local visited = ctx.shared.visited[landmark.id] or -1
      local distance = distance_sq(ctx.self.x, ctx.self.y, landmark.x, landmark.y)
      if not best or visited < best_visit
          or (visited == best_visit and (distance < best_distance
            or (distance == best_distance and landmark.id < best.id))) then
        best, best_visit, best_distance = landmark, visited, distance
      end
    end
  end
  -- More raiders than landmarks: spread extras deterministically instead of idling.
  best = best or landmarks[(ctx.self.id - 1) % #landmarks + 1]

  local destination_x, destination_y = observation_point(ctx, best)
  local private = ctx.private
  private.mission_kind = "explore"
  private.mission_target_id = best.id
  private.destination_x = destination_x
  private.destination_y = destination_y
  private.mission_assigned_tick = ctx.tick
  private.detour_direction = (ctx.self.id + best.id) % 2 == 0 and 1 or -1
  if not ctx.shared.claims[best.id] or ctx.shared.claims[best.id].expires_tick <= ctx.tick then
    ctx.shared.claims[best.id] = {
      raider_id = ctx.self.id,
      expires_tick = ctx.tick + LEASE_SECS * ctx.ticks_per_second,
    }
  end
  set_mode(ctx, "travel", "landmark assigned")
  return true
end

local function assign_mission(ctx)
  return assign_hunt(ctx) or assign_explore(ctx)
end

local function segment_blocker(ctx, x, y)
  local path_x = x - ctx.self.x
  local path_y = y - ctx.self.y
  local path_length_sq = path_x * path_x + path_y * path_y
  if path_length_sq == 0 then return nil end

  local blocker
  local blocker_t
  for _, hazard in ipairs(ctx.shared.hazards or {}) do
    local to_x = hazard.x - ctx.self.x
    local to_y = hazard.y - ctx.self.y
    local t = math.max(0, math.min(1, (to_x * path_x + to_y * path_y) / path_length_sq))
    local near_x = ctx.self.x + path_x * t - hazard.x
    local near_y = ctx.self.y + path_y * t - hazard.y
    local radius = hazard.safe_radius + ROUTE_MARGIN
    if near_x * near_x + near_y * near_y < radius * radius
        and (not blocker_t or t < blocker_t) then
      blocker, blocker_t = hazard, t
    end
  end
  return blocker
end

local function hazard_cluster(ctx, blocker)
  local cx, cy = blocker.x, blocker.y
  local radius = blocker.safe_radius + ROUTE_MARGIN
  -- Two deterministic passes cover neighboring overlaps without retaining a
  -- pathfinding graph or exceeding the per-entity instruction budget.
  for _ = 1, 2 do
    local changed = false
    for _, hazard in ipairs(ctx.shared.hazards or {}) do
      local other_radius = hazard.safe_radius + ROUTE_MARGIN
      local dx = hazard.x - cx
      local dy = hazard.y - cy
      local distance = math.sqrt(dx * dx + dy * dy)
      if distance < radius + other_radius and distance + other_radius > radius then
        local new_radius = (radius + distance + other_radius) / 2
        if distance > 0 then
          cx = cx + dx / distance * (new_radius - radius)
          cy = cy + dy / distance * (new_radius - radius)
        end
        radius = new_radius
        changed = true
      end
    end
    if not changed then break end
  end
  return cx, cy, radius
end

local function plan_detour(ctx, blocker)
  local cx, cy, radius = hazard_cluster(ctx, blocker)
  local dx = ctx.self.x - cx
  local dy = ctx.self.y - cy
  local distance_sq_from_center = dx * dx + dy * dy
  local distance = math.sqrt(distance_sq_from_center)
  if distance == 0 then
    local angle = (ctx.self.id % 16) * math.pi / 8
    dx, dy, distance, distance_sq_from_center = math.cos(angle), math.sin(angle), 1, 1
  end
  local direction = ctx.private.detour_direction or (ctx.self.id % 2 == 0 and 1 or -1)
  if distance <= radius then
    local outward = radius + ROUTE_MARGIN - distance
    local tangent = math.min(500, radius * 0.3)
    return ctx.self.x + dx / distance * outward - dy / distance * tangent * direction,
      ctx.self.y + dy / distance * outward + dx / distance * tangent * direction
  end
  local scale = radius * radius / distance_sq_from_center
  local offset = radius * math.sqrt(distance_sq_from_center - radius * radius)
    / distance_sq_from_center * direction
  return cx + dx * scale - dy * offset, cy + dy * scale + dx * offset
end

local function navigate(ctx, x, y)
  local private = ctx.private
  if not private.navigation_goal_x
      or distance_sq(private.navigation_goal_x, private.navigation_goal_y, x, y)
        > ARRIVAL_RADIUS * ARRIVAL_RADIUS then
    clear_navigation(private)
    private.navigation_goal_x, private.navigation_goal_y = x, y
  end

  if private.navigation_x
      and distance_sq(ctx.self.x, ctx.self.y, private.navigation_x, private.navigation_y)
        <= ARRIVAL_RADIUS * ARRIVAL_RADIUS then
    private.navigation_x, private.navigation_y = nil, nil
    private.progress_distance, private.progress_tick = nil, nil
  end
  if not private.navigation_x then
    local blocker = segment_blocker(ctx, x, y)
    if blocker then
      private.navigation_x, private.navigation_y = plan_detour(ctx, blocker)
    end
  end

  local target_x = private.navigation_x or x
  local target_y = private.navigation_y or y
  local distance = math.sqrt(distance_sq(ctx.self.x, ctx.self.y, target_x, target_y))
  if not private.progress_tick then
    private.progress_tick, private.progress_distance = ctx.tick, distance
  elseif ctx.tick - private.progress_tick >= STUCK_CHECK_SECS * ctx.ticks_per_second then
    if private.progress_distance - distance < STUCK_PROGRESS then
      private.stuck_checks = (private.stuck_checks or 0) + 1
      private.navigation_x, private.navigation_y = nil, nil
      private.detour_direction = -(private.detour_direction or 1)
      if private.stuck_checks >= MAX_STUCK_CHECKS then private.navigation_failed = true end
    else
      private.stuck_checks = 0
    end
    private.progress_tick, private.progress_distance = ctx.tick, distance
  end
  return move_toward(ctx, target_x, target_y)
end

local function inside_hazard(ctx, extra_margin)
  for _, hazard in ipairs(ctx.shared.hazards or {}) do
    local radius = hazard.safe_radius + extra_margin
    if distance_sq(ctx.self.x, ctx.self.y, hazard.x, hazard.y) <= radius * radius then
      return true
    end
  end
  return false
end

local function choose_escape_target(ctx)
  local horizon = 1800
  local nearby = {}
  for _, hazard in ipairs(ctx.shared.hazards or {}) do
    local reach = horizon + hazard.safe_radius + ROUTE_MARGIN
    if distance_sq(ctx.self.x, ctx.self.y, hazard.x, hazard.y) <= reach * reach then
      table.insert(nearby, hazard)
    end
  end
  local best_x, best_y, best_score
  for index = 0, 15 do
    local angle = (index + ctx.self.id % 16) * math.pi / 8
    local x = ctx.self.x + math.cos(angle) * horizon
    local y = ctx.self.y + math.sin(angle) * horizon
    local score
    for _, hazard in ipairs(nearby) do
      local clearance = math.sqrt(distance_sq(x, y, hazard.x, hazard.y)) - hazard.safe_radius
      if not score or clearance < score then score = clearance end
    end
    if not best_score or score > best_score then
      best_x, best_y, best_score = x, y, score
    end
  end
  return best_x, best_y
end

local function escape_radiation(ctx)
  local private = ctx.private
  if private.escape_x then
    if inside_hazard(ctx, ROUTE_MARGIN) then
      return move_toward(ctx, private.escape_x, private.escape_y)
    end
    private.escape_x, private.escape_y = nil, nil
  end
  if inside_hazard(ctx, ctx.self.speed / ctx.ticks_per_second) then
    private.escape_x, private.escape_y = choose_escape_target(ctx)
    private.last_transition_reason = "radiation escape"
    return move_toward(ctx, private.escape_x, private.escape_y)
  end
end

local function nearest_target(ctx)
  local selected
  local selected_distance
  for _, target in ipairs(ctx.targets) do
    if target.id == ctx.private.target_entity_id then return target end
    local distance = distance_sq(ctx.self.x, ctx.self.y, target.x, target.y)
    if not selected or distance < selected_distance
        or (distance == selected_distance and target.id < selected.id) then
      selected, selected_distance = target, distance
    end
  end
  return selected
end

local function pursue(ctx, target)
  local sighting = ctx.shared.sightings[target.owner_id] or { hunters = {} }
  sighting.x, sighting.y, sighting.tick = target.x, target.y, ctx.tick
  sighting.entity_id = target.id
  ctx.shared.sightings[target.owner_id] = sighting
  ctx.shared.last_seen = {
    owner_id = target.owner_id, entity_id = target.id,
    x = target.x, y = target.y, tick = ctx.tick,
  }

  if ctx.private.hunt_owner_id ~= target.owner_id then
    release_mission(ctx)
    ctx.private.mission_kind = "hunt"
    ctx.private.hunt_owner_id = target.owner_id
    ctx.private.mission_assigned_tick = ctx.tick
    ctx.private.detour_direction = ctx.self.id % 2 == 0 and 1 or -1
    sighting.hunters[ctx.self.id] = ctx.tick + LEASE_SECS * ctx.ticks_per_second
  end
  ctx.private.target_entity_id = target.id
  ctx.private.mission_target_id = target.id
  ctx.private.destination_x, ctx.private.destination_y = target.x, target.y
  set_mode(ctx, "pursue", "player visible")
  if not segment_blocker(ctx, target.x, target.y) then return { target_id = target.id } end
  return navigate(ctx, target.x, target.y)
end

local function maintain_shared_state(ctx)
  local expires_tick = ctx.tick + LEASE_SECS * ctx.ticks_per_second
  local mission = ctx.shared.missions[ctx.self.id]
  if mission then
    mission.expires_tick = expires_tick
    mission.mode = ctx.private.mode
    mission.target_id = ctx.private.mission_target_id
    mission.x, mission.y = ctx.private.destination_x, ctx.private.destination_y
  end
  if ctx.private.mission_kind == "explore" then
    local claim = ctx.shared.claims[ctx.private.mission_target_id]
    if claim and claim.raider_id == ctx.self.id then claim.expires_tick = expires_tick end
  elseif ctx.private.hunt_owner_id then
    local sighting = ctx.shared.sightings[ctx.private.hunt_owner_id]
    if sighting then
      sighting.hunters = sighting.hunters or {}
      sighting.hunters[ctx.self.id] = expires_tick
    end
  end

  if ctx.shared.maintenance_tick
      and ctx.tick - ctx.shared.maintenance_tick < ctx.ticks_per_second then return end
  ctx.shared.maintenance_tick = ctx.tick
  for raider_id, shared_mission in pairs(ctx.shared.missions) do
    if shared_mission.expires_tick <= ctx.tick then ctx.shared.missions[raider_id] = nil end
  end
  for landmark_id, claim in pairs(ctx.shared.claims) do
    if claim.expires_tick <= ctx.tick then ctx.shared.claims[landmark_id] = nil end
  end
  for owner_id, sighting in pairs(ctx.shared.sightings) do
    count_hunters(ctx, sighting)
    if ctx.tick - sighting.tick > LAST_SEEN_SECS * ctx.ticks_per_second
        and next(sighting.hunters) == nil then
      ctx.shared.sightings[owner_id] = nil
    end
  end
end

local function run_hunt(ctx)
  local private = ctx.private
  local sighting = ctx.shared.sightings[private.hunt_owner_id]
  if not sighting or ctx.tick - sighting.tick > LAST_SEEN_SECS * ctx.ticks_per_second then
    release_mission(ctx)
    return nil
  end
  private.destination_x, private.destination_y = sighting.x, sighting.y
  if distance_sq(ctx.self.x, ctx.self.y, sighting.x, sighting.y) <= ARRIVAL_RADIUS * ARRIVAL_RADIUS then
    if private.mode ~= "search" then
      private.deadline_tick = ctx.tick + SEARCH_SECS * ctx.ticks_per_second
      set_mode(ctx, "search", "last known position reached")
    elseif ctx.tick >= private.deadline_tick then
      release_mission(ctx)
      return nil
    end
    return { vx = 0, vy = 0 }
  end
  if private.mode ~= "investigate" then set_mode(ctx, "investigate", "target lost") end
  return navigate(ctx, sighting.x, sighting.y)
end

local function run_explore(ctx)
  local private = ctx.private
  local landmark = ctx.shared.landmark_by_id[private.mission_target_id]
  if not landmark then
    release_mission(ctx)
    return nil
  end

  if private.mode == "observe" then
    if ctx.tick < private.deadline_tick then return { vx = 0, vy = 0 } end
    local dx = ctx.self.x - landmark.x
    local dy = ctx.self.y - landmark.y
    local distance = math.sqrt(dx * dx + dy * dy)
    if distance == 0 then dx, dy, distance = 1, 0, 1 end
    private.destination_x = ctx.self.x + dx / distance * DEPART_DISTANCE
    private.destination_y = ctx.self.y + dy / distance * DEPART_DISTANCE
    set_mode(ctx, "depart", "observation complete")
  end

  if private.mode == "depart" then
    if distance_sq(ctx.self.x, ctx.self.y, private.destination_x, private.destination_y)
        <= ARRIVAL_RADIUS * ARRIVAL_RADIUS then
      ctx.shared.visited[landmark.id] = ctx.tick
      release_mission(ctx)
      return nil
    end
    return navigate(ctx, private.destination_x, private.destination_y)
  end

  if distance_sq(ctx.self.x, ctx.self.y, private.destination_x, private.destination_y)
      <= ARRIVAL_RADIUS * ARRIVAL_RADIUS then
    private.deadline_tick = ctx.tick + OBSERVE_SECS * ctx.ticks_per_second
    set_mode(ctx, "observe", "observation point reached")
    return { vx = 0, vy = 0 }
  end
  return navigate(ctx, private.destination_x, private.destination_y)
end

function tick(ctx)
  maintain_shared_state(ctx)
  local escaping = escape_radiation(ctx)
  if escaping then return escaping end

  local target = nearest_target(ctx)
  if target then return pursue(ctx, target) end

  if ctx.private.navigation_failed then
    release_mission(ctx)
    ctx.private.navigation_failed = nil
    ctx.private.last_transition_reason = "mission abandoned after no progress"
  end

  if not ctx.private.mission_kind then assign_mission(ctx) end
  if ctx.private.mission_kind == "hunt" then
    local command = run_hunt(ctx)
    if command then return command end
  elseif ctx.private.mission_kind == "explore" then
    local command = run_explore(ctx)
    if command then return command end
  end

  if not ctx.private.mission_kind and assign_mission(ctx) then
    return ctx.private.mission_kind == "hunt" and run_hunt(ctx) or run_explore(ctx)
  end
  return { vx = 0, vy = 0 }
end
