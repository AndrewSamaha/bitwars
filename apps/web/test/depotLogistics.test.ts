import { describe, it, expect } from "vitest";
import { create, fromBinary, toBinary } from "@bufbuild/protobuf";
import { EntitySchema } from "@bitwars/shared/gen/entity_pb";
import { DeltaSchema } from "@bitwars/shared/gen/delta_pb";
import { mapEntityToJson, mapDeltaToJson } from "@/lib/db/utils/protobuf";
import { VisibilityFilter } from "@/lib/db/utils/visibility";
import { depotErrors } from "@/lib/content/schemaValidation";

describe("depot logistics", () => {
  it("validates depot service radii and explicit construction times", () => {
    for (const radius of [undefined, 0, -1, Number.NaN, Infinity]) expect(depotErrors({depot:true,depot_range:radius})).not.toEqual([]);
    expect(depotErrors({depot:true,depot_range:4000,builds:[{duration_seconds:10}]})).toEqual([]);
    expect(depotErrors({builds:[{duration_seconds:0}]})).not.toEqual([]);
    expect(depotErrors({})).toEqual([]);
  });
  it("round-trips association and shortage state through snapshot and sparse delta mapping", () => {
    const entity = create(EntitySchema, {id:1n, supply:{depotId:2n, missingResources:["energy"],operational:false,waitingFor:"operation"}});
    const mapped=mapEntityToJson(fromBinary(EntitySchema,toBinary(EntitySchema,entity)));
    expect(mapped.supply).toEqual({depot_id:2,missing_resources:["energy"],operational:false,waiting_for:"operation"});
    const delta=create(DeltaSchema,{updates:[{id:1n,supply:{depotId:0n,operational:true}}]});
    const update=mapDeltaToJson(fromBinary(DeltaSchema,toBinary(DeltaSchema,delta))).updates[0];
    expect(update.supply).toEqual({depot_id:0,missing_resources:[],operational:true,waiting_for:""});
  });
  it("hides enemy logistics and disables unpaid sensors until supply returns", () => {
    const filter=new VisibilityFilter("me",{habitat:{sensor:{range:100}}});
    const supply={depot_id:1,missing_resources:["energy"],operational:false,waiting_for:"operation"};
    const snapshot=filter.filterSnapshot({type:"snapshot",tick:1,entities:[
      {id:1,entity_type_id:"habitat",owner_player_id:"me",pos:{x:0,y:0},supply},
      {id:2,entity_type_id:"habitat",owner_player_id:"enemy",pos:{x:50,y:0},supply,resources:[{resource_type:"food",amount:20}]},
    ]});
    expect(snapshot.entities.map(e=>e.id)).toEqual([1]);
    const delta=filter.filterDelta({type:"delta",tick:2,updates:[{id:1,supply:{...supply,operational:true,waiting_for:"",missing_resources:[]}}]});
    const enemy=delta?.updates.find(e=>e.id===2);
    expect(enemy).toBeDefined(); expect(enemy?.supply).toBeUndefined(); expect(enemy?.resources).toBeUndefined();
  });
});

it("marks the superseded resource fields as deprecated in generated schema", async () => {
  const { default: schema } = await import("@bitwars/content/entity.schema.json");
  for (const field of ["resource_sharing", "resource_reserves", "refinery"] as const) expect(schema.properties[field].deprecated).toBe(true);
  for (const field of Object.values(schema.$defs.ResourceSharingDef.properties)) expect(field.deprecated).toBe(true);
  for (const field of Object.values(schema.$defs.ResourceSharingPolicy.properties)) expect(field.deprecated).toBe(true);
  expect(schema.$defs.RefineryDef.properties.accepts.deprecated).toBe(true);
  expect(schema.$defs.CollectorDef.properties.deposit_entity_types.deprecated).toBe(true);
  expect(schema.$defs.BuildOptionDef.properties.spend_rates.deprecated).toBe(true);
  expect(schema.$defs.UpgradeOptionDef.properties.spend_rates.deprecated).toBe(true);
});
