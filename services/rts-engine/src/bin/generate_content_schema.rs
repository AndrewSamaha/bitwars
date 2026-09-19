#[path = "../content.rs"]
mod content;

fn main() -> anyhow::Result<()> {
    let mut args = std::env::args().skip(1);
    let first = args.next();
    let technology = first.as_deref() == Some("--technology");
    let path = if technology {
        args.next().unwrap_or_else(|| "technology.schema.json".into())
    } else {
        first.unwrap_or_else(|| "entity.schema.json".into())
    };
    let schema = if technology {
        serde_json::to_string_pretty(&schemars::schema_for!(content::TechnologyDef))?
    } else {
        serde_json::to_string_pretty(&schemars::schema_for!(content::EntityTypeDef))?
    };
    std::fs::write(path, schema)?;
    Ok(())
}
