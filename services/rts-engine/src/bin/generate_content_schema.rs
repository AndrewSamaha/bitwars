#[path = "../content.rs"]
mod content;

fn main() -> anyhow::Result<()> {
    let path = std::env::args().nth(1).unwrap_or_else(|| "entity.schema.json".into());
    std::fs::write(path, serde_json::to_string_pretty(&schemars::schema_for!(content::EntityTypeDef))?)?;
    Ok(())
}
