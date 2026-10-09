use std::collections::{BTreeMap, HashMap};
use serde::{Deserialize, Serialize};
use crate::pb::{Entity, Vec2, ResourceInventory, ResourceAmount, ResourceDeposit};

/// M7: Per-player resource totals (player_id → resource_type → amount). Serialized for determinism.
pub type ResourceLedger = HashMap<String, HashMap<String, i64>>;

fn ledger_is_empty(ledger: &ResourceLedger) -> bool {
    ledger.is_empty()
}

/// Core world state containing all entities and components
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct WorldState {
    pub tick: u64,
    pub entities: Vec<SerializableEntity>,
    /// Omit when empty so existing golden hashes (no ledger) stay unchanged.
    #[serde(default, skip_serializing_if = "ledger_is_empty")]
    pub ledger: ResourceLedger,
}

/// Serializable version of Entity for JSON serialization
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SerializableEntity {
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub owner_player_id: String,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub resources: BTreeMap<String, f64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub resource_deposit: Option<SerializableDeposit>,
    pub id: u64,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub entity_type_id: String,
    #[serde(default)]
    pub health: f32,
    pub pos: Option<SerializableVec2>,
    pub vel: Option<SerializableVec2>,
    pub force: Option<SerializableVec2>,
}

#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct SerializableDeposit {
    pub amount: f64,
    pub remaining: f64,
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
            owner_player_id: entity.owner_player_id.clone(),
            resources: entity.resources.as_ref().map(|inventory| inventory.resources.iter()
                .map(|entry| (entry.resource_type.clone(), entry.amount)).collect()).unwrap_or_default(),
            resource_deposit: entity.resource_deposit.map(|deposit| SerializableDeposit { amount: deposit.amount, remaining: deposit.remaining }),
            entity_type_id: entity.entity_type_id.clone(),
            health: entity.health,
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
            owner_player_id: entity.owner_player_id.clone(),
            resources: (!entity.resources.is_empty()).then(|| ResourceInventory { resources: entity.resources.iter()
                .map(|(resource_type, amount)| ResourceAmount { resource_type: resource_type.clone(), amount: *amount }).collect() }),
            resource_deposit: entity.resource_deposit.map(|deposit| ResourceDeposit { amount: deposit.amount, remaining: deposit.remaining }),
            entity_type_id: entity.entity_type_id.clone(),
            health: entity.health,
            pos: entity.pos.map(|v| Vec2 { x: v.x, y: v.y }),
            vel: entity.vel.map(|v| Vec2 { x: v.x, y: v.y }),
            force: entity.force.map(|v| Vec2 { x: v.x, y: v.y }),
        }
    }
}

impl WorldState {
    /// Create a new world state with the given tick and entities (ledger empty).
    pub fn new(tick: u64, entities: Vec<Entity>) -> Self {
        let serializable_entities = entities.iter().map(SerializableEntity::from).collect();
        Self {
            tick,
            entities: serializable_entities,
            ledger: ResourceLedger::new(),
        }
    }

    /// Create a new world state with the given tick, entities, and ledger.
    pub fn new_with_ledger(tick: u64, entities: Vec<Entity>, ledger: ResourceLedger) -> Self {
        let serializable_entities = entities.iter().map(SerializableEntity::from).collect();
        Self { tick, entities: serializable_entities, ledger }
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
