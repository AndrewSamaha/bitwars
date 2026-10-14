//! Formation geometry and movement shared by group orders. The caller owns
//! membership, phases, route progression, persistence and lifecycle events.
use crate::pb;

#[derive(Clone, Copy, Debug)]
pub(super) enum FormationCommand {
    Assemble,
    TravelTo(pb::Vec2),
    /// Leave anchor, positions and velocities untouched while combat owns motion.
    Suspended,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub(super) enum FormationProgress {
    Assembling,
    Ready,
    Traveling,
    Arrived,
    Suspended,
    Unavailable,
}

pub(super) struct FormationLayout {
    pub anchor: pb::Vec2,
    pub slots: Vec<pb::ConvoySlot>,
}

/// Capture a deterministic centroid and hull-spaced grid from authoritative
/// positions. Validation of ownership and command eligibility belongs to orders.
pub(super) fn formation_layout(
    entities: &[pb::Entity],
    member_ids: &[u64],
    hull_radius_for: impl Fn(&pb::Entity) -> f32,
) -> Option<FormationLayout> {
    if member_ids.is_empty() {
        return None;
    }
    let mut ids = member_ids.to_vec();
    ids.sort_unstable();
    if ids.windows(2).any(|pair| pair[0] == pair[1]) {
        return None;
    }
    let count = ids.len() as f64;
    let mut center = (0.0_f64, 0.0_f64);
    let mut radius = 0.0_f32;
    for id in &ids {
        let entity = entities.iter().find(|entity| entity.id == *id)?;
        let position = entity.pos?;
        let hull_radius = hull_radius_for(entity);
        if !finite(position) || !hull_radius.is_finite() || hull_radius < 0.0 {
            return None;
        }
        center.0 += position.x as f64 / count;
        center.1 += position.y as f64 / count;
        radius = radius.max(hull_radius);
    }
    let spacing = radius * 2.0 + 1.0;
    if !spacing.is_finite() {
        return None;
    }
    let slots = formation_slots(ids, spacing);
    if slots.iter().any(|slot| !slot.offset.is_some_and(finite)) {
        return None;
    }
    Some(FormationLayout {
        anchor: pb::Vec2 {
            x: center.0 as f32,
            y: center.1 as f32,
        },
        slots,
    })
}

/// Fixed world-axis grid centered on occupied slots, independent of selection order.
pub(super) fn formation_slots(mut ids: Vec<u64>, spacing: f32) -> Vec<pb::ConvoySlot> {
    if ids.is_empty() {
        return Vec::new();
    }
    ids.sort_unstable();
    let columns = (ids.len() as f32).sqrt().ceil() as usize;
    let raw: Vec<_> = (0..ids.len())
        .map(|i| ((i % columns) as f32, (i / columns) as f32))
        .collect();
    let mean_x = raw.iter().map(|point| point.0).sum::<f32>() / ids.len() as f32;
    let mean_y = raw.iter().map(|point| point.1).sum::<f32>() / ids.len() as f32;
    ids.into_iter()
        .zip(raw)
        .map(|(entity_id, (x, y))| pb::ConvoySlot {
            entity_id,
            offset: Some(pb::Vec2 {
                x: (x - mean_x) * spacing,
                y: (y - mean_y) * spacing,
            }),
        })
        .collect()
}

/// Borrows the order's checkpointed state directly; no second copy of anchor or
/// offsets can diverge during suspension, regrouping, or checkpoint recovery.
pub(super) struct FormationMover<'a> {
    pub anchor: &'a mut pb::Vec2,
    pub slots: &'a [pb::ConvoySlot],
}

impl FormationMover<'_> {
    /// Called after ordinary physics for exact, undamped group movement. Orders
    /// suppress their members' ordinary movement before integration. Suspended
    /// orders instead leave combat's motion alone and do not advance the anchor.
    pub fn step(
        &mut self,
        entities: &mut [pb::Entity],
        command: FormationCommand,
        speed_for: impl Fn(&pb::Entity) -> f32,
        dt: f32,
    ) -> FormationProgress {
        if matches!(command, FormationCommand::Suspended) {
            return FormationProgress::Suspended;
        }
        if self.slots.is_empty() || !finite(*self.anchor) || !dt.is_finite() || dt < 0.0 {
            return FormationProgress::Unavailable;
        }
        // Missing/dead members must be pruned by the owning order. Never treat
        // a missing member as ready, or partially move an invalid formation.
        if self.slots.iter().any(|slot| {
            !slot.offset.is_some_and(finite)
                || !entities.iter().any(|entity| {
                    entity.id == slot.entity_id
                        && entity.pos.is_some_and(finite)
                        && entity.health > 0.0
                        && speed_for(entity).is_finite()
                        && speed_for(entity) >= 0.0
                })
        }) {
            return FormationProgress::Unavailable;
        }
        match command {
            FormationCommand::Assemble => {
                let mut ready = true;
                for slot in self.slots {
                    let offset = slot.offset.unwrap();
                    let entity = entities
                        .iter_mut()
                        .find(|entity| entity.id == slot.entity_id)
                        .unwrap();
                    let speed = speed_for(entity);
                    let position = entity.pos.as_mut().unwrap();
                    let target = translated(*self.anchor, offset);
                    let (next, arrived) = approach(*position, target, speed * dt);
                    entity.vel = Some(velocity(*position, next, arrived, dt));
                    *position = next;
                    ready &= arrived;
                }
                if ready {
                    FormationProgress::Ready
                } else {
                    FormationProgress::Assembling
                }
            }
            FormationCommand::TravelTo(destination) => {
                if !finite(destination) {
                    return FormationProgress::Unavailable;
                }
                let speed = self
                    .slots
                    .iter()
                    .map(|slot| {
                        speed_for(
                            entities
                                .iter()
                                .find(|entity| entity.id == slot.entity_id)
                                .unwrap(),
                        )
                    })
                    .fold(f32::INFINITY, f32::min);
                let (next, arrived) = approach(*self.anchor, destination, speed * dt);
                let shared_velocity = velocity(*self.anchor, next, arrived, dt);
                *self.anchor = next;
                for slot in self.slots {
                    let entity = entities
                        .iter_mut()
                        .find(|entity| entity.id == slot.entity_id)
                        .unwrap();
                    entity.pos = Some(translated(next, slot.offset.unwrap()));
                    entity.vel = Some(shared_velocity);
                }
                if arrived {
                    FormationProgress::Arrived
                } else {
                    FormationProgress::Traveling
                }
            }
            FormationCommand::Suspended => unreachable!(),
        }
    }
}

fn finite(point: pb::Vec2) -> bool {
    point.x.is_finite() && point.y.is_finite()
}
fn translated(anchor: pb::Vec2, offset: pb::Vec2) -> pb::Vec2 {
    pb::Vec2 {
        x: anchor.x + offset.x,
        y: anchor.y + offset.y,
    }
}
fn velocity(from: pb::Vec2, to: pb::Vec2, arrived: bool, dt: f32) -> pb::Vec2 {
    if arrived || dt <= 0.0 {
        pb::Vec2 { x: 0.0, y: 0.0 }
    } else {
        pb::Vec2 {
            x: (to.x - from.x) / dt,
            y: (to.y - from.y) / dt,
        }
    }
}
fn approach(from: pb::Vec2, to: pb::Vec2, step: f32) -> (pb::Vec2, bool) {
    let dx = to.x - from.x;
    let dy = to.y - from.y;
    let distance = dx.hypot(dy);
    if distance <= step.max(0.0) || distance <= 0.0001 {
        return (to, true);
    }
    let fraction = step.max(0.0) / distance;
    (
        pb::Vec2 {
            x: from.x + dx * fraction,
            y: from.y + dy * fraction,
        },
        false,
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn point(x: f32) -> pb::Vec2 {
        pb::Vec2 { x, y: 0.0 }
    }
    fn members() -> Vec<pb::Entity> {
        vec![
            pb::Entity {
                id: 1,
                pos: Some(point(-1.0)),
                health: 10.0,
                ..Default::default()
            },
            pb::Entity {
                id: 2,
                pos: Some(point(1.0)),
                health: 10.0,
                ..Default::default()
            },
        ]
    }
    fn speed_for(entity: &pb::Entity) -> f32 {
        if entity.id == 1 {
            2.0
        } else {
            8.0
        }
    }

    #[test]
    fn layout_uses_centroid_largest_hull_and_stable_member_order() {
        let mut entities = members();
        entities[0].pos = Some(point(-30.0));
        entities[1].pos = Some(point(10.0));
        let radius = |entity: &pb::Entity| if entity.id == 1 { 10.0 } else { 50.0 };
        let a = formation_layout(&entities, &[2, 1], radius).unwrap();
        let b = formation_layout(&entities, &[1, 2], radius).unwrap();
        assert_eq!(a.anchor, point(-10.0));
        assert_eq!(a.anchor, b.anchor);
        assert_eq!(a.slots, b.slots);
        assert_eq!(a.slots[0].entity_id, 1);
        assert_eq!(
            a.slots[1].offset.unwrap().x - a.slots[0].offset.unwrap().x,
            101.0
        );
    }

    #[test]
    fn suspension_preserves_combat_motion_and_navigation_anchor() {
        let mut anchor = point(0.0);
        let slots = formation_slots(vec![1, 2], 2.0);
        let mut entities = members();
        entities[0].pos = Some(point(30.0));
        entities[0].vel = Some(point(8.0));
        entities[1].pos = Some(point(-10.0));
        entities[1].vel = Some(point(-2.0));
        let before = entities.clone();
        let progress = FormationMover {
            anchor: &mut anchor,
            slots: &slots,
        }
        .step(&mut entities, FormationCommand::Suspended, speed_for, 1.0);
        assert_eq!(progress, FormationProgress::Suspended);
        assert_eq!(anchor, point(0.0));
        assert_eq!(entities, before);
    }

    #[test]
    fn regrouping_reuses_offsets_and_waits_for_the_slowest_returning_member() {
        let mut anchor = point(0.0);
        let slots = formation_slots(vec![1, 2], 2.0);
        let original_slots = slots.clone();
        let mut entities = members();
        entities[0].pos = Some(point(-7.0));
        entities[0].vel = Some(point(100.0));
        entities[1].pos = Some(point(9.0));
        let mut mover = FormationMover {
            anchor: &mut anchor,
            slots: &slots,
        };
        assert_eq!(
            mover.step(&mut entities, FormationCommand::Assemble, speed_for, 1.0),
            FormationProgress::Assembling
        );
        assert_eq!(entities[1].pos, Some(point(1.0)));
        assert_eq!(entities[1].vel, Some(point(0.0)));
        assert_eq!(
            mover.step(&mut entities, FormationCommand::Assemble, speed_for, 1.0),
            FormationProgress::Assembling
        );
        assert_eq!(
            mover.step(&mut entities, FormationCommand::Assemble, speed_for, 1.0),
            FormationProgress::Ready
        );
        assert_eq!(*mover.anchor, point(0.0));
        assert_eq!(slots, original_slots);
        assert_eq!(
            mover.step(
                &mut entities,
                FormationCommand::TravelTo(point(10.0)),
                speed_for,
                1.0
            ),
            FormationProgress::Traveling
        );
        assert_eq!(*mover.anchor, point(2.0));
        assert_eq!(entities[0].pos, Some(point(1.0)));
        assert_eq!(entities[1].pos, Some(point(3.0)));
        assert_eq!(entities[0].vel, entities[1].vel);
    }

    #[test]
    fn arrivals_can_advance_a_ping_pong_route_without_releasing_members() {
        let mut route = pb::NavigationRoute {
            waypoints: vec![point(0.0), point(10.0), point(20.0)],
            next_waypoint_index: 1,
            direction: 1,
            traversal: pb::RouteTraversal::PingPong as i32,
        };
        let mut anchor = point(0.0);
        let slots = formation_slots(vec![1, 2], 2.0);
        let mut entities = members();
        let mut reached = Vec::new();
        for _ in 0..5 {
            let destination = route.destination().unwrap();
            let progress = FormationMover {
                anchor: &mut anchor,
                slots: &slots,
            }
            .step(
                &mut entities,
                FormationCommand::TravelTo(destination),
                speed_for,
                100.0,
            );
            assert_eq!(progress, FormationProgress::Arrived);
            reached.push(anchor.x);
            assert_eq!(entities.len(), 2);
            assert_eq!(entities[0].pos.unwrap().x, anchor.x - 1.0);
            assert_eq!(entities[1].pos.unwrap().x, anchor.x + 1.0);
            assert_eq!(entities[0].vel, Some(point(0.0)));
            assert!(route.advance());
        }
        assert_eq!(reached, vec![10.0, 20.0, 10.0, 0.0, 10.0]);
    }

    #[test]
    fn one_member_uses_zero_offset_and_its_own_speed() {
        let mut entities = vec![members().remove(0)];
        let mut layout = formation_layout(&entities, &[1], |_| 50.0).unwrap();
        assert_eq!(layout.slots[0].offset, Some(point(0.0)));
        let mut mover = FormationMover {
            anchor: &mut layout.anchor,
            slots: &layout.slots,
        };
        assert_eq!(
            mover.step(&mut entities, FormationCommand::Assemble, speed_for, 1.0),
            FormationProgress::Ready
        );
        assert_eq!(
            mover.step(
                &mut entities,
                FormationCommand::TravelTo(point(10.0)),
                speed_for,
                1.0
            ),
            FormationProgress::Traveling
        );
        assert_eq!(entities[0].pos, Some(point(1.0)));
    }

    #[test]
    fn missing_members_and_invalid_steps_cannot_partially_move_the_formation() {
        let mut anchor = point(0.0);
        let slots = formation_slots(vec![1, 2, 3], 2.0);
        let mut entities = members();
        let before = entities.clone();
        let mut mover = FormationMover {
            anchor: &mut anchor,
            slots: &slots,
        };
        assert_eq!(
            mover.step(&mut entities, FormationCommand::Assemble, speed_for, 1.0),
            FormationProgress::Unavailable
        );
        assert_eq!(entities, before);
        assert_eq!(*mover.anchor, point(0.0));
        let slots = formation_slots(vec![1, 2], 2.0);
        let mut mover = FormationMover {
            anchor: &mut anchor,
            slots: &slots,
        };
        for dt in [-1.0, f32::NAN, f32::INFINITY] {
            assert_eq!(
                mover.step(
                    &mut entities,
                    FormationCommand::TravelTo(point(10.0)),
                    speed_for,
                    dt
                ),
                FormationProgress::Unavailable
            );
        }
        assert_eq!(entities, before);
        assert_eq!(*mover.anchor, point(0.0));
        assert!(formation_layout(&entities, &[], |_| 50.0).is_none());
        assert!(formation_layout(&entities, &[1, 1], |_| 50.0).is_none());
    }
}
