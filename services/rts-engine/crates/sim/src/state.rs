use serde::{Deserialize, Serialize};
use crate::pb::{Entity, Vec2};

/// Core world state containing all entities and components
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WorldState {
    pub tick: u64,
    pub entities: Vec<SerializableEntity>,
}

/// Serializable version of Entity for JSON serialization
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SerializableEntity {
    pub id: u64,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub entity_type_id: String,
    pub pos: Option<SerializableVec2>,
    pub vel: Option<SerializableVec2>,
    pub force: Option<SerializableVec2>,
}

/// Serializable version of Vec2 for JSON serialization
#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct SerializableVec2 {
    pub x: f32,
    pub y: f32,
}

impl From<&Entity> for SerializableEntity {
    fn from(entity: &Entity) -> Self {
        Self {
            id: entity.id,
            entity_type_id: entity.entity_type_id.clone(),
            pos: entity.pos.map(|v| SerializableVec2 { x: v.x, y: v.y }),
            vel: entity.vel.map(|v| SerializableVec2 { x: v.x, y: v.y }),
            force: entity.force.map(|v| SerializableVec2 { x: v.x, y: v.y }),
        }
    }
}

impl From<&SerializableEntity> for Entity {
    fn from(entity: &SerializableEntity) -> Self {
        Self {
            id: entity.id,
            entity_type_id: entity.entity_type_id.clone(),
            pos: entity.pos.map(|v| Vec2 { x: v.x, y: v.y }),
            vel: entity.vel.map(|v| Vec2 { x: v.x, y: v.y }),
            force: entity.force.map(|v| Vec2 { x: v.x, y: v.y }),
        }
    }
}

impl WorldState {
    /// Create a new world state with the given tick and entities
    pub fn new(tick: u64, entities: Vec<Entity>) -> Self {
        let serializable_entities = entities.iter().map(SerializableEntity::from).collect();
        Self { tick, entities: serializable_entities }
    }

    /// Find an entity by ID
    pub fn find_entity(&self, id: u64) -> Option<&SerializableEntity> {
        self.entities.iter().find(|e| e.id == id)
    }

    /// Find an entity by ID (mutable)
    pub fn find_entity_mut(&mut self, id: u64) -> Option<&mut SerializableEntity> {
        self.entities.iter_mut().find(|e| e.id == id)
    }
}