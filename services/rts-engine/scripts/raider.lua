function tick(ctx)
  local target
  local closest_sq
  for _, candidate in ipairs(ctx.targets) do
    local dx = candidate.x - ctx.x
    local dy = candidate.y - ctx.y
    local distance_sq = dx * dx + dy * dy
    if not closest_sq or distance_sq < closest_sq or (distance_sq == closest_sq and candidate.id < target.id) then
      target = candidate
      closest_sq = distance_sq
    end
  end

  if target then
    return { target_id = target.id }
  end

  if not ctx.star then
    return { vx = 0, vy = 0 }
  end

  local dx = ctx.star.x - ctx.x
  local dy = ctx.star.y - ctx.y
  local distance = math.sqrt(dx * dx + dy * dy)
  if distance == 0 then
    return { vx = ctx.speed, vy = 0 }
  end

  if math.abs(distance - ctx.orbit_radius) > 20 then
    local direction = distance > ctx.orbit_radius and 1 or -1
    return { vx = dx / distance * ctx.speed * direction, vy = dy / distance * ctx.speed * direction }
  end

  return { vx = -dy / distance * ctx.speed, vy = dx / distance * ctx.speed }
end
