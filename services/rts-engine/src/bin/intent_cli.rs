use std::env;

use rts_engine::io::redis::RedisClient; // if this path differs, adjust accordingly
use rts_engine::pb;
use uuid::Uuid;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Usage: intent_cli <redis_url> <game_id> move <entity_id> <x> <y> <client_cmd_id> <player_id>
    let args: Vec<String> = env::args().collect();
    if args.len() < 3 {
        eprintln!("Usage:\n  intent_cli <redis_url> <game_id> move <entity_id> <x> <y> <client_cmd_id> <player_id>");
        std::process::exit(1);
    }

    let redis_url = &args[1];
    let game_id = args[2].clone();

    let mut client = RedisClient::connect(redis_url, game_id).await?;

    if args.len() >= 9 && args[3].to_lowercase() == "move" {
        let entity_id: u64 = args[4].parse().expect("entity_id must be u64");
        let x: f32 = args[5].parse().expect("x must be f32");
        let y: f32 = args[6].parse().expect("y must be f32");
        let client_cmd_id = args[7].clone();
        let player_id = args[8].clone();

        let move_intent = pb::MoveToLocationIntent {
            entity_id,
            target: Some(pb::Vec2 { x, y }),
            client_cmd_id: String::new(),
            player_id: String::new(),
        };

        let client_cmd_uuid = Uuid::parse_str(&client_cmd_id).unwrap_or_else(|_| Uuid::now_v7());
        let envelope = pb::IntentEnvelope {
            client_cmd_id: client_cmd_uuid.into_bytes().to_vec(),
            intent_id: Uuid::now_v7().into_bytes().to_vec(),
            player_id,
            client_seq: 0,
            server_tick: 0,
            protocol_version: 1,
            policy: pb::IntentPolicy::ReplaceActive as i32,
            payload: Some(pb::intent_envelope::Payload::Move(move_intent)),
        };

        let id = client.publish_intent_envelope(&envelope).await?;
        println!("Published intent with id {}", id);
    } else {
        eprintln!("Unsupported or malformed command. Currently only 'move' is supported.");
        std::process::exit(2);
    }

    Ok(())
}
