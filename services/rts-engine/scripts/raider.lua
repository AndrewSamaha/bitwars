local LAST_SEEN_SECS = 90
local WAYPOINT_RADIUS = 250

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
      table.insert(waypoints, { id = entity.id, x = entity.x, y = entity.y })
    end
  end
  table.sort(waypoints, function(a, b) return a.id < b.id end)
  ctx.shared.waypoints = waypoints
  ctx.shared.visited = {}
end

function tick(ctx)
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
    return { target_id = target.id }
  end

  local last_seen = ctx.shared.last_seen
  local sighting_lifetime = LAST_SEEN_SECS * ctx.ticks_per_second
  if last_seen and ctx.tick - last_seen.tick <= sighting_lifetime then
    local dx = last_seen.x - ctx.self.x
    local dy = last_seen.y - ctx.self.y
    if dx * dx + dy * dy > WAYPOINT_RADIUS * WAYPOINT_RADIUS then
      return move_toward(ctx, last_seen.x, last_seen.y)
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
  if dx * dx + dy * dy <= WAYPOINT_RADIUS * WAYPOINT_RADIUS then
    ctx.shared.visited[waypoint.id] = ctx.tick
    ctx.private.waypoint_index = ctx.private.waypoint_index % #waypoints + 1
    waypoint = waypoints[ctx.private.waypoint_index]
  end
  return move_toward(ctx, waypoint.x, waypoint.y)
end
