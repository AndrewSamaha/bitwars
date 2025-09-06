fn main() {
    let mut config = prost_build::Config::new();
    config.out_dir("src/pb");

    tonic_build::configure()
        .compile_well_known_types(true)
        .build_server(false)
        .build_client(false)
        .file_descriptor_set_path("src/pb/descriptor.bin");

    config
        .compile_protos(
            &["../../packages/schemas/proto/world.proto"], // adjust path
            &["../../packages/schemas/proto"],
        )
        .expect("Failed to compile protos");

    println!("cargo:rerun-if-changed=../../packages/schemas/proto/world.proto");
}
