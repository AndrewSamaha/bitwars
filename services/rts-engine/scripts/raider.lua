local LAST_SEEN_SECS = 90
local WAYPOINT_RADIUS = 250
local RADIATION_MARGIN = 100

local function move_toward(ctx, x, y)
  local dx = x - ctx.self.x
  local dy = y - ctx.self.y
  local distance = math.sqrt(dx * dx + dy * dy)
  if distance == 0 then
    return { vx = 0, vy = 0 }
  end
  return { vx = dx / distance * ctx.self.speed, vy = dy / distance * ctx.self.speed }
end

function world_tick(ctx)
  if ctx.shared.waypoints then
    return
  end

  local waypoints = {}
  for _, entity in ipairs(ctx.entities) do
    if entity.entity_type_id == "theta" or entity.entity_type_id == "star_yellow" then
      table.insert(waypoints, {
        id = entity.id,
        x = entity.x,
        y = entity.y,
        safe_radius = entity.radiation_radius + RADIATION_MARGIN,
      })
    end
  end
  table.sort(waypoints, function(a, b) return a.id < b.id end)
  ctx.shared.waypoints = waypoints
  ctx.shared.visited = {}
end

local function escape_radiation(ctx, waypoints)
  for _, waypoint in ipairs(waypoints or {}) do
    local dx = ctx.self.x - waypoint.x
    local dy = ctx.self.y - waypoint.y
    local distance = math.sqrt(dx * dx + dy * dy)
    if distance <= waypoint.safe_radius + ctx.self.speed / ctx.ticks_per_second then
      if distance == 0 then
        dx, dy, distance = 1, 0, 1
      end
      return move_toward(ctx,
        waypoint.x + dx / distance * waypoint.safe_radius,
        waypoint.y + dy / distance * waypoint.safe_radius)
    end
  end
end

local function safe_waypoint_position(ctx, waypoint)
  local dx = ctx.self.x - waypoint.x
  local dy = ctx.self.y - waypoint.y
  local distance = math.sqrt(dx * dx + dy * dy)
  if distance == 0 then
    dx, dy, distance = 1, 0, 1
  end
  local radius = waypoint.safe_radius + WAYPOINT_RADIUS
  return waypoint.x + dx / distance * radius, waypoint.y + dy / distance * radius
end

local function route_target(ctx, x, y, waypoints)
  local path_x = x - ctx.self.x
  local path_y = y - ctx.self.y
  local path_length_sq = path_x * path_x + path_y * path_y
  if path_length_sq == 0 then return x, y end

  local blocker
  local blocker_t
  for _, waypoint in ipairs(waypoints or {}) do
    local to_circle_x = waypoint.x - ctx.self.x
    local to_circle_y = waypoint.y - ctx.self.y
    local t = math.max(0, math.min(1, (to_circle_x * path_x + to_circle_y * path_y) / path_length_sq))
    local near_x = ctx.self.x + path_x * t - waypoint.x
    local near_y = ctx.self.y + path_y * t - waypoint.y
    local radius = waypoint.safe_radius + WAYPOINT_RADIUS
    if near_x * near_x + near_y * near_y < radius * radius and (not blocker_t or t < blocker_t) then
      blocker, blocker_t = waypoint, t
    end
  end
  if not blocker then return x, y end

  local dx = ctx.self.x - blocker.x
  local dy = ctx.self.y - blocker.y
  local distance_sq = dx * dx + dy * dy
  local distance = math.sqrt(distance_sq)
  local radius = blocker.safe_radius + WAYPOINT_RADIUS
  if distance == 0 then dx, dy, distance, distance_sq = 1, 0, 1, 1 end
  local cross = dx * (y - blocker.y) - dy * (x - blocker.x)
  local direction = cross == 0 and (blocker.id % 2 == 0 and 1 or -1) or (cross > 0 and 1 or -1)

  if distance <= radius + ctx.self.speed / ctx.ticks_per_second then
    -- Walk around the routing ring while correcting outward; targeting a
    -- rotated point on the ring creates a smaller, stable chord orbit.
    local outward = radius + ctx.self.speed / ctx.ticks_per_second - distance
    local tangent = radius * 0.312
    return ctx.self.x + dx / distance * outward - dy / distance * tangent * direction,
      ctx.self.y + dy / distance * outward + dx / distance * tangent * direction
  end

  local scale = radius * radius / distance_sq
  local offset = radius * math.sqrt(distance_sq - radius * radius) / distance_sq * direction
  return blocker.x + dx * scale - dy * offset, blocker.y + dy * scale + dx * offset
end

local function move_safely_toward(ctx, x, y, waypoints)
  local safe_x, safe_y = route_target(ctx, x, y, waypoints)
  return move_toward(ctx, safe_x, safe_y)
end

function tick(ctx)
  local escaping = escape_radiation(ctx, ctx.shared.waypoints)
  if escaping then
    return escaping
  end

  local target
  local closest_sq
  for _, candidate in ipairs(ctx.targets) do
    local dx = candidate.x - ctx.self.x
    local dy = candidate.y - ctx.self.y
    local distance_sq = dx * dx + dy * dy
    if not closest_sq or distance_sq < closest_sq or (distance_sq == closest_sq and candidate.id < target.id) then
      target = candidate
      closest_sq = distance_sq
    end
  end

  if target then
    ctx.shared.last_seen = {
      owner_id = target.owner_id,
      entity_id = target.id,
      x = target.x,
      y = target.y,
      tick = ctx.tick,
    }
    local route_x, route_y = route_target(ctx, target.x, target.y, ctx.shared.waypoints)
    if route_x == target.x and route_y == target.y then
      return { target_id = target.id }
    end
    return move_toward(ctx, route_x, route_y)
  end

  local last_seen = ctx.shared.last_seen
  local sighting_lifetime = LAST_SEEN_SECS * ctx.ticks_per_second
  if last_seen and ctx.tick - last_seen.tick <= sighting_lifetime then
    local dx = last_seen.x - ctx.self.x
    local dy = last_seen.y - ctx.self.y
    if dx * dx + dy * dy > WAYPOINT_RADIUS * WAYPOINT_RADIUS then
      return move_safely_toward(ctx, last_seen.x, last_seen.y, ctx.shared.waypoints)
    end
  end

  local waypoints = ctx.shared.waypoints
  if not waypoints or #waypoints == 0 then
    return { vx = 0, vy = 0 }
  end

  if not ctx.private.waypoint_index then
    ctx.private.waypoint_index = (ctx.self.id - 1) % #waypoints + 1
  end
  local waypoint = waypoints[ctx.private.waypoint_index]
  local dx = waypoint.x - ctx.self.x
  local dy = waypoint.y - ctx.self.y
  if dx * dx + dy * dy <= (waypoint.safe_radius + WAYPOINT_RADIUS) ^ 2 then
    ctx.shared.visited[waypoint.id] = ctx.tick
    ctx.private.waypoint_index = ctx.private.waypoint_index % #waypoints + 1
    waypoint = waypoints[ctx.private.waypoint_index]
  end
  local x, y = safe_waypoint_position(ctx, waypoint)
  return move_safely_toward(ctx, x, y, waypoints)
end
