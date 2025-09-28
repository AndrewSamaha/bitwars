use std::env;

use rts_engine::io::redis::RedisClient; // if this path differs, adjust accordingly
use rts_engine::pb;

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
            client_cmd_id,
            player_id,
        };
        let intent = pb::Intent { kind: Some(pb::intent::Kind::Move(move_intent)) };

        let id = client.publish_intent(&intent).await?;
        println!("Published intent with id {}", id);
    } else {
        eprintln!("Unsupported or malformed command. Currently only 'move' is supported.");
        std::process::exit(2);
    }

    Ok(())
}
