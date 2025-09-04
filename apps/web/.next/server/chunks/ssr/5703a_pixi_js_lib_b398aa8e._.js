module.exports = [
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/localUniformBit.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "localUniformBit",
    ()=>localUniformBit,
    "localUniformBitGl",
    ()=>localUniformBitGl,
    "localUniformBitGroup2",
    ()=>localUniformBitGroup2
]);
"use strict";
const localUniformBit = {
    name: "local-uniform-bit",
    vertex: {
        header: /* wgsl */ `

            struct LocalUniforms {
                uTransformMatrix:mat3x3<f32>,
                uColor:vec4<f32>,
                uRound:f32,
            }

            @group(1) @binding(0) var<uniform> localUniforms : LocalUniforms;
        `,
        main: /* wgsl */ `
            vColor *= localUniforms.uColor;
            modelMatrix *= localUniforms.uTransformMatrix;
        `,
        end: /* wgsl */ `
            if(localUniforms.uRound == 1)
            {
                vPosition = vec4(roundPixels(vPosition.xy, globalUniforms.uResolution), vPosition.zw);
            }
        `
    }
};
const localUniformBitGroup2 = {
    ...localUniformBit,
    vertex: {
        ...localUniformBit.vertex,
        // replace the group!
        header: localUniformBit.vertex.header.replace("group(1)", "group(2)")
    }
};
const localUniformBitGl = {
    name: "local-uniform-bit",
    vertex: {
        header: /* glsl */ `

            uniform mat3 uTransformMatrix;
            uniform vec4 uColor;
            uniform float uRound;
        `,
        main: /* glsl */ `
            vColor *= uColor;
            modelMatrix = uTransformMatrix;
        `,
        end: /* glsl */ `
            if(uRound == 1.)
            {
                gl_Position.xy = roundPixels(gl_Position.xy, uResolution);
            }
        `
    }
};
;
 //# sourceMappingURL=localUniformBit.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/gl/GlGraphicsAdaptor.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlGraphicsAdaptor",
    ()=>GlGraphicsAdaptor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compileHighShaderToProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compileHighShaderToProgram.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$colorBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/colorBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$generateTextureBatchBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/generateTextureBatchBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$localUniformBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/localUniformBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$roundPixelsBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/roundPixelsBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$getBatchSamplersUniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/getBatchSamplersUniformGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/Shader.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UniformGroup.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
"use strict";
class GlGraphicsAdaptor {
    contextChange(renderer) {
        const uniforms = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UniformGroup"]({
            uColor: {
                value: new Float32Array([
                    1,
                    1,
                    1,
                    1
                ]),
                type: "vec4<f32>"
            },
            uTransformMatrix: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"](),
                type: "mat3x3<f32>"
            },
            uRound: {
                value: 0,
                type: "f32"
            }
        });
        const maxTextures = renderer.limits.maxBatchableTextures;
        const glProgram = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compileHighShaderToProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["compileHighShaderGlProgram"])({
            name: "graphics",
            bits: [
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$colorBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["colorBitGl"],
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$generateTextureBatchBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateTextureBatchBitGl"])(maxTextures),
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$localUniformBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["localUniformBitGl"],
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$roundPixelsBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roundPixelsBitGl"]
            ]
        });
        this.shader = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Shader"]({
            glProgram,
            resources: {
                localUniforms: uniforms,
                batchSamplers: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$getBatchSamplersUniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getBatchSamplersUniformGroup"])(maxTextures)
            }
        });
    }
    execute(graphicsPipe, renderable) {
        const context = renderable.context;
        const shader = context.customShader || this.shader;
        const renderer = graphicsPipe.renderer;
        const contextSystem = renderer.graphicsContext;
        const { batcher, instructions } = contextSystem.getContextRenderData(context);
        shader.groups[0] = renderer.globalUniforms.bindGroup;
        renderer.state.set(graphicsPipe.state);
        renderer.shader.bind(shader);
        renderer.geometry.bind(batcher.geometry, shader.glProgram);
        const batches = instructions.instructions;
        for(let i = 0; i < instructions.instructionSize; i++){
            const batch = batches[i];
            if (batch.size) {
                for(let j = 0; j < batch.textures.count; j++){
                    renderer.texture.bind(batch.textures.textures[j], j);
                }
                renderer.geometry.draw(batch.topology, batch.size, batch.start);
            }
        }
    }
    destroy() {
        this.shader.destroy(true);
        this.shader = null;
    }
}
/** @ignore */ GlGraphicsAdaptor.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipesAdaptor
    ],
    name: "graphics"
};
;
 //# sourceMappingURL=GlGraphicsAdaptor.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/textureBit.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "textureBit",
    ()=>textureBit,
    "textureBitGl",
    ()=>textureBitGl
]);
"use strict";
const textureBit = {
    name: "texture-bit",
    vertex: {
        header: /* wgsl */ `

        struct TextureUniforms {
            uTextureMatrix:mat3x3<f32>,
        }

        @group(2) @binding(2) var<uniform> textureUniforms : TextureUniforms;
        `,
        main: /* wgsl */ `
            uv = (textureUniforms.uTextureMatrix * vec3(uv, 1.0)).xy;
        `
    },
    fragment: {
        header: /* wgsl */ `
            @group(2) @binding(0) var uTexture: texture_2d<f32>;
            @group(2) @binding(1) var uSampler: sampler;


        `,
        main: /* wgsl */ `
            outColor = textureSample(uTexture, uSampler, vUV);
        `
    }
};
const textureBitGl = {
    name: "texture-bit",
    vertex: {
        header: /* glsl */ `
            uniform mat3 uTextureMatrix;
        `,
        main: /* glsl */ `
            uv = (uTextureMatrix * vec3(uv, 1.0)).xy;
        `
    },
    fragment: {
        header: /* glsl */ `
        uniform sampler2D uTexture;


        `,
        main: /* glsl */ `
            outColor = texture(uTexture, vUV);
        `
    }
};
;
 //# sourceMappingURL=textureBit.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/mesh/gl/GlMeshAdaptor.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlMeshAdaptor",
    ()=>GlMeshAdaptor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compileHighShaderToProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/compileHighShaderToProgram.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$localUniformBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/localUniformBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$roundPixelsBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/roundPixelsBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$textureBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/high-shader/shader-bits/textureBit.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/Shader.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
"use strict";
class GlMeshAdaptor {
    init() {
        const glProgram = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$compileHighShaderToProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["compileHighShaderGlProgram"])({
            name: "mesh",
            bits: [
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$localUniformBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["localUniformBitGl"],
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$textureBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["textureBitGl"],
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$high$2d$shader$2f$shader$2d$bits$2f$roundPixelsBit$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["roundPixelsBitGl"]
            ]
        });
        this._shader = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Shader"]({
            glProgram,
            resources: {
                uTexture: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"].EMPTY.source,
                textureUniforms: {
                    uTextureMatrix: {
                        type: "mat3x3<f32>",
                        value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"]()
                    }
                }
            }
        });
    }
    execute(meshPipe, mesh) {
        const renderer = meshPipe.renderer;
        let shader = mesh._shader;
        if (!shader) {
            shader = this._shader;
            const texture = mesh.texture;
            const source = texture.source;
            shader.resources.uTexture = source;
            shader.resources.uSampler = source.style;
            shader.resources.textureUniforms.uniforms.uTextureMatrix = texture.textureMatrix.mapCoord;
        } else if (!shader.glProgram) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("Mesh shader has no glProgram", mesh.shader);
            return;
        }
        shader.groups[100] = renderer.globalUniforms.bindGroup;
        shader.groups[101] = meshPipe.localUniformsBindGroup;
        renderer.encoder.draw({
            geometry: mesh._geometry,
            shader,
            state: mesh.state
        });
    }
    destroy() {
        this._shader.destroy(true);
        this._shader = null;
    }
}
GlMeshAdaptor.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipesAdaptor
    ],
    name: "mesh"
};
;
 //# sourceMappingURL=GlMeshAdaptor.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/State.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "State",
    ()=>State
]);
"use strict";
const blendModeIds = {
    normal: 0,
    add: 1,
    multiply: 2,
    screen: 3,
    overlay: 4,
    erase: 5,
    "normal-npm": 6,
    "add-npm": 7,
    "screen-npm": 8,
    min: 9,
    max: 10
};
const BLEND = 0;
const OFFSET = 1;
const CULLING = 2;
const DEPTH_TEST = 3;
const WINDING = 4;
const DEPTH_MASK = 5;
const _State = class _State {
    constructor(){
        this.data = 0;
        this.blendMode = "normal";
        this.polygonOffset = 0;
        this.blend = true;
        this.depthMask = true;
    }
    /**
   * Activates blending of the computed fragment color values.
   * @default true
   */ get blend() {
        return !!(this.data & 1 << BLEND);
    }
    set blend(value) {
        if (!!(this.data & 1 << BLEND) !== value) {
            this.data ^= 1 << BLEND;
        }
    }
    /**
   * Activates adding an offset to depth values of polygon's fragments
   * @default false
   */ get offsets() {
        return !!(this.data & 1 << OFFSET);
    }
    set offsets(value) {
        if (!!(this.data & 1 << OFFSET) !== value) {
            this.data ^= 1 << OFFSET;
        }
    }
    /** The culling settings for this state none - No culling back - Back face culling front - Front face culling */ set cullMode(value) {
        if (value === "none") {
            this.culling = false;
            return;
        }
        this.culling = true;
        this.clockwiseFrontFace = value === "front";
    }
    get cullMode() {
        if (!this.culling) {
            return "none";
        }
        return this.clockwiseFrontFace ? "front" : "back";
    }
    /**
   * Activates culling of polygons.
   * @default false
   */ get culling() {
        return !!(this.data & 1 << CULLING);
    }
    set culling(value) {
        if (!!(this.data & 1 << CULLING) !== value) {
            this.data ^= 1 << CULLING;
        }
    }
    /**
   * Activates depth comparisons and updates to the depth buffer.
   * @default false
   */ get depthTest() {
        return !!(this.data & 1 << DEPTH_TEST);
    }
    set depthTest(value) {
        if (!!(this.data & 1 << DEPTH_TEST) !== value) {
            this.data ^= 1 << DEPTH_TEST;
        }
    }
    /**
   * Enables or disables writing to the depth buffer.
   * @default true
   */ get depthMask() {
        return !!(this.data & 1 << DEPTH_MASK);
    }
    set depthMask(value) {
        if (!!(this.data & 1 << DEPTH_MASK) !== value) {
            this.data ^= 1 << DEPTH_MASK;
        }
    }
    /**
   * Specifies whether or not front or back-facing polygons can be culled.
   * @default false
   */ get clockwiseFrontFace() {
        return !!(this.data & 1 << WINDING);
    }
    set clockwiseFrontFace(value) {
        if (!!(this.data & 1 << WINDING) !== value) {
            this.data ^= 1 << WINDING;
        }
    }
    /**
   * The blend mode to be applied when this state is set. Apply a value of `normal` to reset the blend mode.
   * Setting this mode to anything other than NO_BLEND will automatically switch blending on.
   * @default 'normal'
   */ get blendMode() {
        return this._blendMode;
    }
    set blendMode(value) {
        this.blend = value !== "none";
        this._blendMode = value;
        this._blendModeId = blendModeIds[value] || 0;
    }
    /**
   * The polygon offset. Setting this property to anything other than 0 will automatically enable polygon offset fill.
   * @default 0
   */ get polygonOffset() {
        return this._polygonOffset;
    }
    set polygonOffset(value) {
        this.offsets = !!value;
        this._polygonOffset = value;
    }
    toString() {
        return `[pixi.js/core:State blendMode=${this.blendMode} clockwiseFrontFace=${this.clockwiseFrontFace} culling=${this.culling} depthMask=${this.depthMask} polygonOffset=${this.polygonOffset}]`;
    }
    /**
   * A quickly getting an instance of a State that is configured for 2d rendering.
   * @returns a new State with values set for 2d rendering
   */ static for2d() {
        const state = new _State();
        state.depthTest = false;
        state.blend = true;
        return state;
    }
};
_State.default2d = _State.for2d();
let State = _State;
;
 //# sourceMappingURL=State.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/gl/GlBatchAdaptor.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlBatchAdaptor",
    ()=>GlBatchAdaptor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/State.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
class GlBatchAdaptor {
    constructor(){
        this._tempState = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"].for2d();
        /**
     * We only want to sync the a batched shaders uniforms once on first use
     * this is a hash of shader uids to a boolean value.  When the shader is first bound
     * we set the value to true.  When the shader is bound again we check the value and
     * if it is true we know that the uniforms have already been synced and we skip it.
     */ this._didUploadHash = {};
    }
    init(batcherPipe) {
        batcherPipe.renderer.runners.contextChange.add(this);
    }
    contextChange() {
        this._didUploadHash = {};
    }
    start(batchPipe, geometry, shader) {
        const renderer = batchPipe.renderer;
        const didUpload = this._didUploadHash[shader.uid];
        renderer.shader.bind(shader, didUpload);
        if (!didUpload) {
            this._didUploadHash[shader.uid] = true;
        }
        renderer.shader.updateUniformGroup(renderer.globalUniforms.uniformGroup);
        renderer.geometry.bind(geometry, shader.glProgram);
    }
    execute(batchPipe, batch) {
        const renderer = batchPipe.renderer;
        this._tempState.blendMode = batch.blendMode;
        renderer.state.set(this._tempState);
        const textures = batch.textures.textures;
        for(let i = 0; i < batch.textures.count; i++){
            renderer.texture.bind(textures[i], i);
        }
        renderer.geometry.draw(batch.topology, batch.size, batch.start);
    }
}
/** @ignore */ GlBatchAdaptor.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipesAdaptor
    ],
    name: "batch"
};
;
 //# sourceMappingURL=GlBatchAdaptor.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/CustomRenderPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CustomRenderPipe",
    ()=>CustomRenderPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
;
"use strict";
class CustomRenderPipe {
    constructor(renderer){
        this._renderer = renderer;
    }
    updateRenderable() {}
    destroyRenderable() {}
    validateRenderable() {
        return false;
    }
    addRenderable(container, instructionSet) {
        this._renderer.renderPipes.batch.break(instructionSet);
        instructionSet.add(container);
    }
    execute(container) {
        if (!container.isRenderable) return;
        container.render(this._renderer);
    }
    destroy() {
        this._renderer = null;
    }
}
CustomRenderPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "customRender"
};
;
 //# sourceMappingURL=CustomRenderPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite/BatchableSprite.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BatchableSprite",
    ()=>BatchableSprite
]);
"use strict";
class BatchableSprite {
    constructor(){
        this.batcherName = "default";
        this.topology = "triangle-list";
        // batch specific..
        this.attributeSize = 4;
        this.indexSize = 6;
        this.packAsQuad = true;
        this.roundPixels = 0;
        this._attributeStart = 0;
        // location in the buffer
        this._batcher = null;
        this._batch = null;
    }
    get blendMode() {
        return this.renderable.groupBlendMode;
    }
    get color() {
        return this.renderable.groupColorAlpha;
    }
    reset() {
        this.renderable = null;
        this.texture = null;
        this._batcher = null;
        this._batch = null;
        this.bounds = null;
    }
    destroy() {}
}
;
 //# sourceMappingURL=BatchableSprite.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/executeInstructions.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "executeInstructions",
    ()=>executeInstructions
]);
"use strict";
function executeInstructions(renderGroup, renderer) {
    const instructionSet = renderGroup.instructionSet;
    const instructions = instructionSet.instructions;
    for(let i = 0; i < instructionSet.instructionSize; i++){
        const instruction = instructions[i];
        renderer[instruction.renderPipeId].execute(instruction);
    }
}
;
 //# sourceMappingURL=executeInstructions.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/RenderGroupPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RenderGroupPipe",
    ()=>RenderGroupPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/PoolGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$BatchableSprite$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite/BatchableSprite.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$executeInstructions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/executeInstructions.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
"use strict";
const tempMatrix = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"]();
class RenderGroupPipe {
    constructor(renderer){
        this._renderer = renderer;
    }
    addRenderGroup(renderGroup, instructionSet) {
        if (renderGroup.isCachedAsTexture) {
            this._addRenderableCacheAsTexture(renderGroup, instructionSet);
        } else {
            this._addRenderableDirect(renderGroup, instructionSet);
        }
    }
    execute(renderGroup) {
        if (!renderGroup.isRenderable) return;
        if (renderGroup.isCachedAsTexture) {
            this._executeCacheAsTexture(renderGroup);
        } else {
            this._executeDirect(renderGroup);
        }
    }
    destroy() {
        this._renderer = null;
    }
    _addRenderableDirect(renderGroup, instructionSet) {
        this._renderer.renderPipes.batch.break(instructionSet);
        if (renderGroup._batchableRenderGroup) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BigPool"].return(renderGroup._batchableRenderGroup);
            renderGroup._batchableRenderGroup = null;
        }
        instructionSet.add(renderGroup);
    }
    _addRenderableCacheAsTexture(renderGroup, instructionSet) {
        const batchableRenderGroup = renderGroup._batchableRenderGroup ?? (renderGroup._batchableRenderGroup = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BigPool"].get(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$BatchableSprite$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BatchableSprite"]));
        batchableRenderGroup.renderable = renderGroup.root;
        batchableRenderGroup.transform = renderGroup.root.relativeGroupTransform;
        batchableRenderGroup.texture = renderGroup.texture;
        batchableRenderGroup.bounds = renderGroup._textureBounds;
        instructionSet.add(renderGroup);
        this._renderer.renderPipes.blendMode.pushBlendMode(renderGroup, renderGroup.root.groupBlendMode, instructionSet);
        this._renderer.renderPipes.batch.addToBatch(batchableRenderGroup, instructionSet);
        this._renderer.renderPipes.blendMode.popBlendMode(instructionSet);
    }
    _executeCacheAsTexture(renderGroup) {
        if (renderGroup.textureNeedsUpdate) {
            renderGroup.textureNeedsUpdate = false;
            const worldTransformMatrix = tempMatrix.identity().translate(-renderGroup._textureBounds.x, -renderGroup._textureBounds.y);
            this._renderer.renderTarget.push(renderGroup.texture, true, null, renderGroup.texture.frame);
            this._renderer.globalUniforms.push({
                worldTransformMatrix,
                worldColor: 4294967295,
                offset: {
                    x: 0,
                    y: 0
                }
            });
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$executeInstructions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["executeInstructions"])(renderGroup, this._renderer.renderPipes);
            this._renderer.renderTarget.finishRenderPass();
            this._renderer.renderTarget.pop();
            this._renderer.globalUniforms.pop();
        }
        renderGroup._batchableRenderGroup._batcher.updateElement(renderGroup._batchableRenderGroup);
        renderGroup._batchableRenderGroup._batcher.geometry.buffers[0].update();
    }
    _executeDirect(renderGroup) {
        this._renderer.globalUniforms.push({
            worldTransformMatrix: renderGroup.inverseParentTextureTransform,
            worldColor: renderGroup.worldColorAlpha
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$executeInstructions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["executeInstructions"])(renderGroup, this._renderer.renderPipes);
        this._renderer.globalUniforms.pop();
    }
}
RenderGroupPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "renderGroup"
};
;
 //# sourceMappingURL=RenderGroupPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/clearList.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearList",
    ()=>clearList
]);
"use strict";
function clearList(list, index) {
    index || (index = 0);
    for(let j = index; j < list.length; j++){
        if (list[j]) {
            list[j] = null;
        } else {
            break;
        }
    }
}
;
 //# sourceMappingURL=clearList.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/updateRenderGroupTransforms.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "updateRenderGroupTransform",
    ()=>updateRenderGroupTransform,
    "updateRenderGroupTransforms",
    ()=>updateRenderGroupTransforms,
    "updateTransformAndChildren",
    ()=>updateTransformAndChildren
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/Container.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$clearList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/clearList.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$multiplyColors$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/multiplyColors.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
const tempContainer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Container"]();
const UPDATE_BLEND_COLOR_VISIBLE = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UPDATE_VISIBLE"] | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UPDATE_COLOR"] | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UPDATE_BLEND"];
function updateRenderGroupTransforms(renderGroup, updateChildRenderGroups = false) {
    updateRenderGroupTransform(renderGroup);
    const childrenToUpdate = renderGroup.childrenToUpdate;
    const updateTick = renderGroup.updateTick++;
    for(const j in childrenToUpdate){
        const renderGroupDepth = Number(j);
        const childrenAtDepth = childrenToUpdate[j];
        const list = childrenAtDepth.list;
        const index = childrenAtDepth.index;
        for(let i = 0; i < index; i++){
            const child = list[i];
            if (child.parentRenderGroup === renderGroup && child.relativeRenderGroupDepth === renderGroupDepth) {
                updateTransformAndChildren(child, updateTick, 0);
            }
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$clearList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clearList"])(list, index);
        childrenAtDepth.index = 0;
    }
    if (updateChildRenderGroups) {
        for(let i = 0; i < renderGroup.renderGroupChildren.length; i++){
            updateRenderGroupTransforms(renderGroup.renderGroupChildren[i], updateChildRenderGroups);
        }
    }
}
function updateRenderGroupTransform(renderGroup) {
    const root = renderGroup.root;
    let worldAlpha;
    if (renderGroup.renderGroupParent) {
        const renderGroupParent = renderGroup.renderGroupParent;
        renderGroup.worldTransform.appendFrom(root.relativeGroupTransform, renderGroupParent.worldTransform);
        renderGroup.worldColor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$multiplyColors$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["multiplyColors"])(root.groupColor, renderGroupParent.worldColor);
        worldAlpha = root.groupAlpha * renderGroupParent.worldAlpha;
    } else {
        renderGroup.worldTransform.copyFrom(root.localTransform);
        renderGroup.worldColor = root.localColor;
        worldAlpha = root.localAlpha;
    }
    worldAlpha = worldAlpha < 0 ? 0 : worldAlpha > 1 ? 1 : worldAlpha;
    renderGroup.worldAlpha = worldAlpha;
    renderGroup.worldColorAlpha = renderGroup.worldColor + ((worldAlpha * 255 | 0) << 24);
}
function updateTransformAndChildren(container, updateTick, updateFlags) {
    if (updateTick === container.updateTick) return;
    container.updateTick = updateTick;
    container.didChange = false;
    const localTransform = container.localTransform;
    container.updateLocalTransform();
    const parent = container.parent;
    if (parent && !parent.renderGroup) {
        updateFlags |= container._updateFlags;
        container.relativeGroupTransform.appendFrom(localTransform, parent.relativeGroupTransform);
        if (updateFlags & UPDATE_BLEND_COLOR_VISIBLE) {
            updateColorBlendVisibility(container, parent, updateFlags);
        }
    } else {
        updateFlags = container._updateFlags;
        container.relativeGroupTransform.copyFrom(localTransform);
        if (updateFlags & UPDATE_BLEND_COLOR_VISIBLE) {
            updateColorBlendVisibility(container, tempContainer, updateFlags);
        }
    }
    if (!container.renderGroup) {
        const children = container.children;
        const length = children.length;
        for(let i = 0; i < length; i++){
            updateTransformAndChildren(children[i], updateTick, updateFlags);
        }
        const renderGroup = container.parentRenderGroup;
        const renderable = container;
        if (renderable.renderPipeId && !renderGroup.structureDidChange) {
            renderGroup.updateRenderable(renderable);
        }
    }
}
function updateColorBlendVisibility(container, parent, updateFlags) {
    if (updateFlags & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UPDATE_COLOR"]) {
        container.groupColor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$multiplyColors$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["multiplyColors"])(container.localColor, parent.groupColor);
        let groupAlpha = container.localAlpha * parent.groupAlpha;
        groupAlpha = groupAlpha < 0 ? 0 : groupAlpha > 1 ? 1 : groupAlpha;
        container.groupAlpha = groupAlpha;
        container.groupColorAlpha = container.groupColor + ((groupAlpha * 255 | 0) << 24);
    }
    if (updateFlags & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UPDATE_BLEND"]) {
        container.groupBlendMode = container.localBlendMode === "inherit" ? parent.groupBlendMode : container.localBlendMode;
    }
    if (updateFlags & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UPDATE_VISIBLE"]) {
        container.globalDisplayStatus = container.localDisplayStatus & parent.globalDisplayStatus;
    }
    container._updateFlags = 0;
}
;
 //# sourceMappingURL=updateRenderGroupTransforms.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/validateRenderables.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "validateRenderables",
    ()=>validateRenderables
]);
"use strict";
function validateRenderables(renderGroup, renderPipes) {
    const { list, index } = renderGroup.childrenRenderablesToUpdate;
    let rebuildRequired = false;
    for(let i = 0; i < index; i++){
        const container = list[i];
        const renderable = container;
        const pipe = renderPipes[renderable.renderPipeId];
        rebuildRequired = pipe.validateRenderable(container);
        if (rebuildRequired) {
            break;
        }
    }
    renderGroup.structureDidChange = rebuildRequired;
    return rebuildRequired;
}
;
 //# sourceMappingURL=validateRenderables.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/RenderGroupSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RenderGroupSystem",
    ()=>RenderGroupSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TexturePool.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureStyle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TextureStyle.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/Bounds.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$clearList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/clearList.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$executeInstructions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/executeInstructions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$updateRenderGroupTransforms$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/updateRenderGroupTransforms.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$validateRenderables$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/utils/validateRenderables.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
"use strict";
const tempMatrix = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"]();
class RenderGroupSystem {
    constructor(renderer){
        this._renderer = renderer;
    }
    render({ container, transform }) {
        const parent = container.parent;
        const renderGroupParent = container.renderGroup.renderGroupParent;
        container.parent = null;
        container.renderGroup.renderGroupParent = null;
        const renderer = this._renderer;
        const originalLocalTransform = tempMatrix;
        if (transform) {
            originalLocalTransform.copyFrom(container.renderGroup.localTransform);
            container.renderGroup.localTransform.copyFrom(transform);
        }
        const renderPipes = renderer.renderPipes;
        this._updateCachedRenderGroups(container.renderGroup, null);
        this._updateRenderGroups(container.renderGroup);
        renderer.globalUniforms.start({
            worldTransformMatrix: transform ? container.renderGroup.localTransform : container.renderGroup.worldTransform,
            worldColor: container.renderGroup.worldColorAlpha
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$executeInstructions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["executeInstructions"])(container.renderGroup, renderPipes);
        if (renderPipes.uniformBatch) {
            renderPipes.uniformBatch.renderEnd();
        }
        if (transform) {
            container.renderGroup.localTransform.copyFrom(originalLocalTransform);
        }
        container.parent = parent;
        container.renderGroup.renderGroupParent = renderGroupParent;
    }
    destroy() {
        this._renderer = null;
    }
    _updateCachedRenderGroups(renderGroup, closestCacheAsTexture) {
        renderGroup._parentCacheAsTextureRenderGroup = closestCacheAsTexture;
        if (renderGroup.isCachedAsTexture) {
            if (!renderGroup.textureNeedsUpdate) return;
            closestCacheAsTexture = renderGroup;
        }
        for(let i = renderGroup.renderGroupChildren.length - 1; i >= 0; i--){
            this._updateCachedRenderGroups(renderGroup.renderGroupChildren[i], closestCacheAsTexture);
        }
        renderGroup.invalidateMatrices();
        if (renderGroup.isCachedAsTexture) {
            if (renderGroup.textureNeedsUpdate) {
                const bounds = renderGroup.root.getLocalBounds();
                bounds.ceil();
                const lastTexture = renderGroup.texture;
                if (renderGroup.texture) {
                    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].returnTexture(renderGroup.texture, true);
                }
                const renderer = this._renderer;
                const resolution = renderGroup.textureOptions.resolution || renderer.view.resolution;
                const antialias = renderGroup.textureOptions.antialias ?? renderer.view.antialias;
                const scaleMode = renderGroup.textureOptions.scaleMode ?? "linear";
                const texture = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].getOptimalTexture(bounds.width, bounds.height, resolution, antialias);
                texture._source.style = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureStyle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureStyle"]({
                    scaleMode
                });
                renderGroup.texture = texture;
                renderGroup._textureBounds || (renderGroup._textureBounds = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Bounds"]());
                renderGroup._textureBounds.copyFrom(bounds);
                if (lastTexture !== renderGroup.texture) {
                    if (renderGroup.renderGroupParent) {
                        renderGroup.renderGroupParent.structureDidChange = true;
                    }
                }
            }
        } else if (renderGroup.texture) {
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].returnTexture(renderGroup.texture, true);
            renderGroup.texture = null;
        }
    }
    _updateRenderGroups(renderGroup) {
        const renderer = this._renderer;
        const renderPipes = renderer.renderPipes;
        renderGroup.runOnRender(renderer);
        renderGroup.instructionSet.renderPipes = renderPipes;
        if (!renderGroup.structureDidChange) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$validateRenderables$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["validateRenderables"])(renderGroup, renderPipes);
        } else {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$clearList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clearList"])(renderGroup.childrenRenderablesToUpdate.list, 0);
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$updateRenderGroupTransforms$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["updateRenderGroupTransforms"])(renderGroup);
        if (renderGroup.structureDidChange) {
            renderGroup.structureDidChange = false;
            this._buildInstructions(renderGroup, renderer);
        } else {
            this._updateRenderables(renderGroup);
        }
        renderGroup.childrenRenderablesToUpdate.index = 0;
        renderer.renderPipes.batch.upload(renderGroup.instructionSet);
        if (renderGroup.isCachedAsTexture && !renderGroup.textureNeedsUpdate) return;
        for(let i = 0; i < renderGroup.renderGroupChildren.length; i++){
            this._updateRenderGroups(renderGroup.renderGroupChildren[i]);
        }
    }
    _updateRenderables(renderGroup) {
        const { list, index } = renderGroup.childrenRenderablesToUpdate;
        for(let i = 0; i < index; i++){
            const container = list[i];
            if (container.didViewUpdate) {
                renderGroup.updateRenderable(container);
            }
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$utils$2f$clearList$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clearList"])(list, index);
    }
    _buildInstructions(renderGroup, rendererOrPipes) {
        const root = renderGroup.root;
        const instructionSet = renderGroup.instructionSet;
        instructionSet.reset();
        const renderer = rendererOrPipes.renderPipes ? rendererOrPipes : rendererOrPipes.batch.renderer;
        const renderPipes = renderer.renderPipes;
        renderPipes.batch.buildStart(instructionSet);
        renderPipes.blendMode.buildStart();
        renderPipes.colorMask.buildStart();
        if (root.sortableChildren) {
            root.sortChildren();
        }
        root.collectRenderablesWithEffects(instructionSet, renderer, null);
        renderPipes.batch.buildEnd(instructionSet);
        renderPipes.blendMode.buildEnd(instructionSet);
    }
}
/** @ignore */ RenderGroupSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasSystem
    ],
    name: "renderGroup"
};
;
 //# sourceMappingURL=RenderGroupSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite/SpritePipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SpritePipe",
    ()=>SpritePipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$BatchableSprite$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite/BatchableSprite.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
class SpritePipe {
    constructor(renderer){
        this._renderer = renderer;
    }
    addRenderable(sprite, instructionSet) {
        const gpuSprite = this._getGpuSprite(sprite);
        if (sprite.didViewUpdate) this._updateBatchableSprite(sprite, gpuSprite);
        this._renderer.renderPipes.batch.addToBatch(gpuSprite, instructionSet);
    }
    updateRenderable(sprite) {
        const gpuSprite = this._getGpuSprite(sprite);
        if (sprite.didViewUpdate) this._updateBatchableSprite(sprite, gpuSprite);
        gpuSprite._batcher.updateElement(gpuSprite);
    }
    validateRenderable(sprite) {
        const gpuSprite = this._getGpuSprite(sprite);
        return !gpuSprite._batcher.checkAndUpdateTexture(gpuSprite, sprite._texture);
    }
    _updateBatchableSprite(sprite, batchableSprite) {
        batchableSprite.bounds = sprite.visualBounds;
        batchableSprite.texture = sprite._texture;
    }
    _getGpuSprite(sprite) {
        return sprite._gpuData[this._renderer.uid] || this._initGPUSprite(sprite);
    }
    _initGPUSprite(sprite) {
        const batchableSprite = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$BatchableSprite$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BatchableSprite"]();
        batchableSprite.renderable = sprite;
        batchableSprite.transform = sprite.groupTransform;
        batchableSprite.texture = sprite._texture;
        batchableSprite.bounds = sprite.visualBounds;
        batchableSprite.roundPixels = this._renderer._roundPixels | sprite._roundPixels;
        sprite._gpuData[this._renderer.uid] = batchableSprite;
        return batchableSprite;
    }
    destroy() {
        this._renderer = null;
    }
}
/** @ignore */ SpritePipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "sprite"
};
;
 //# sourceMappingURL=SpritePipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/shared/BatcherPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BatcherPipe",
    ()=>BatcherPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/State.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$DefaultBatcher$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/shared/DefaultBatcher.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
const _BatcherPipe = class _BatcherPipe {
    constructor(renderer, adaptor){
        this.state = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"].for2d();
        this._batchersByInstructionSet = /* @__PURE__ */ Object.create(null);
        /** A record of all active batchers, keyed by their names */ this._activeBatches = /* @__PURE__ */ Object.create(null);
        this.renderer = renderer;
        this._adaptor = adaptor;
        this._adaptor.init?.(this);
    }
    static getBatcher(name) {
        return new this._availableBatchers[name]();
    }
    buildStart(instructionSet) {
        let batchers = this._batchersByInstructionSet[instructionSet.uid];
        if (!batchers) {
            batchers = this._batchersByInstructionSet[instructionSet.uid] = /* @__PURE__ */ Object.create(null);
            batchers.default || (batchers.default = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$DefaultBatcher$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultBatcher"]({
                maxTextures: this.renderer.limits.maxBatchableTextures
            }));
        }
        this._activeBatches = batchers;
        this._activeBatch = this._activeBatches.default;
        for(const i in this._activeBatches){
            this._activeBatches[i].begin();
        }
    }
    addToBatch(batchableObject, instructionSet) {
        if (this._activeBatch.name !== batchableObject.batcherName) {
            this._activeBatch.break(instructionSet);
            let batch = this._activeBatches[batchableObject.batcherName];
            if (!batch) {
                batch = this._activeBatches[batchableObject.batcherName] = _BatcherPipe.getBatcher(batchableObject.batcherName);
                batch.begin();
            }
            this._activeBatch = batch;
        }
        this._activeBatch.add(batchableObject);
    }
    break(instructionSet) {
        this._activeBatch.break(instructionSet);
    }
    buildEnd(instructionSet) {
        this._activeBatch.break(instructionSet);
        const batches = this._activeBatches;
        for(const i in batches){
            const batch = batches[i];
            const geometry = batch.geometry;
            geometry.indexBuffer.setDataWithSize(batch.indexBuffer, batch.indexSize, true);
            geometry.buffers[0].setDataWithSize(batch.attributeBuffer.float32View, batch.attributeSize, false);
        }
    }
    upload(instructionSet) {
        const batchers = this._batchersByInstructionSet[instructionSet.uid];
        for(const i in batchers){
            const batcher = batchers[i];
            const geometry = batcher.geometry;
            if (batcher.dirty) {
                batcher.dirty = false;
                geometry.buffers[0].update(batcher.attributeSize * 4);
            }
        }
    }
    execute(batch) {
        if (batch.action === "startBatch") {
            const batcher = batch.batcher;
            const geometry = batcher.geometry;
            const shader = batcher.shader;
            this._adaptor.start(this, geometry, shader);
        }
        this._adaptor.execute(this, batch);
    }
    destroy() {
        this.state = null;
        this.renderer = null;
        this._adaptor = null;
        for(const i in this._activeBatches){
            this._activeBatches[i].destroy();
        }
        this._activeBatches = null;
    }
};
/** @ignore */ _BatcherPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "batch"
};
_BatcherPipe._availableBatchers = /* @__PURE__ */ Object.create(null);
let BatcherPipe = _BatcherPipe;
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].handleByMap(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].Batcher, BatcherPipe._availableBatchers);
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$DefaultBatcher$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DefaultBatcher"]);
;
 //# sourceMappingURL=BatcherPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/Filter.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Filter",
    ()=>Filter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlProgram.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$GpuProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/GpuProgram.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/Shader.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/State.mjs [app-ssr] (ecmascript)");
;
;
;
;
"use strict";
const _Filter = class _Filter extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Shader"] {
    /**
   * @param options - The optional parameters of this filter.
   */ constructor(options){
        options = {
            ..._Filter.defaultOptions,
            ...options
        };
        super(options);
        /** If enabled is true the filter is applied, if false it will not. */ this.enabled = true;
        /**
     * The gpu state the filter requires to render.
     * @internal
     */ this._state = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"].for2d();
        this.blendMode = options.blendMode;
        this.padding = options.padding;
        if (typeof options.antialias === "boolean") {
            this.antialias = options.antialias ? "on" : "off";
        } else {
            this.antialias = options.antialias;
        }
        this.resolution = options.resolution;
        this.blendRequired = options.blendRequired;
        this.clipToViewport = options.clipToViewport;
        this.addResource("uTexture", 0, 1);
    }
    /**
   * Applies the filter
   * @param filterManager - The renderer to retrieve the filter from
   * @param input - The input render target.
   * @param output - The target to output to.
   * @param clearMode - Should the output be cleared before rendering to it
   */ apply(filterManager, input, output, clearMode) {
        filterManager.applyFilter(this, input, output, clearMode);
    }
    /**
   * Get the blend mode of the filter.
   * @default "normal"
   */ get blendMode() {
        return this._state.blendMode;
    }
    /** Sets the blend mode of the filter. */ set blendMode(value) {
        this._state.blendMode = value;
    }
    /**
   * A short hand function to create a filter based of a vertex and fragment shader src.
   * @param options
   * @returns A shiny new PixiJS filter!
   */ static from(options) {
        const { gpu, gl, ...rest } = options;
        let gpuProgram;
        let glProgram;
        if (gpu) {
            gpuProgram = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$GpuProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuProgram"].from(gpu);
        }
        if (gl) {
            glProgram = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlProgram"].from(gl);
        }
        return new _Filter({
            gpuProgram,
            glProgram,
            ...rest
        });
    }
};
/** The default filter settings */ _Filter.defaultOptions = {
    blendMode: "normal",
    resolution: 1,
    padding: 0,
    antialias: "off",
    blendRequired: false,
    clipToViewport: true
};
let Filter = _Filter;
;
 //# sourceMappingURL=Filter.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/mask/mask.frag.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>fragment
]);
var fragment = "in vec2 vMaskCoord;\nin vec2 vTextureCoord;\n\nuniform sampler2D uTexture;\nuniform sampler2D uMaskTexture;\n\nuniform float uAlpha;\nuniform vec4 uMaskClamp;\nuniform float uInverse;\n\nout vec4 finalColor;\n\nvoid main(void)\n{\n    float clip = step(3.5,\n        step(uMaskClamp.x, vMaskCoord.x) +\n        step(uMaskClamp.y, vMaskCoord.y) +\n        step(vMaskCoord.x, uMaskClamp.z) +\n        step(vMaskCoord.y, uMaskClamp.w));\n\n    // TODO look into why this is needed\n    float npmAlpha = uAlpha;\n    vec4 original = texture(uTexture, vTextureCoord);\n    vec4 masky = texture(uMaskTexture, vMaskCoord);\n    float alphaMul = 1.0 - npmAlpha * (1.0 - masky.a);\n\n    float a = alphaMul * masky.r * npmAlpha * clip;\n\n    if (uInverse == 1.0) {\n        a = 1.0 - a;\n    }\n\n    finalColor = original * a;\n}\n";
;
 //# sourceMappingURL=mask.frag.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/mask/mask.vert.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>vertex
]);
var vertex = "in vec2 aPosition;\n\nout vec2 vTextureCoord;\nout vec2 vMaskCoord;\n\n\nuniform vec4 uInputSize;\nuniform vec4 uOutputFrame;\nuniform vec4 uOutputTexture;\nuniform mat3 uFilterMatrix;\n\nvec4 filterVertexPosition(  vec2 aPosition )\n{\n    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;\n       \n    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;\n    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;\n\n    return vec4(position, 0.0, 1.0);\n}\n\nvec2 filterTextureCoord(  vec2 aPosition )\n{\n    return aPosition * (uOutputFrame.zw * uInputSize.zw);\n}\n\nvec2 getFilterCoord( vec2 aPosition )\n{\n    return  ( uFilterMatrix * vec3( filterTextureCoord(aPosition), 1.0)  ).xy;\n}   \n\nvoid main(void)\n{\n    gl_Position = filterVertexPosition(aPosition);\n    vTextureCoord = filterTextureCoord(aPosition);\n    vMaskCoord = getFilterCoord(aPosition);\n}\n";
;
 //# sourceMappingURL=mask.vert.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/mask/mask.wgsl.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>source
]);
var source = "struct GlobalFilterUniforms {\n  uInputSize:vec4<f32>,\n  uInputPixel:vec4<f32>,\n  uInputClamp:vec4<f32>,\n  uOutputFrame:vec4<f32>,\n  uGlobalFrame:vec4<f32>,\n  uOutputTexture:vec4<f32>,\n};\n\nstruct MaskUniforms {\n  uFilterMatrix:mat3x3<f32>,\n  uMaskClamp:vec4<f32>,\n  uAlpha:f32,\n  uInverse:f32,\n};\n\n@group(0) @binding(0) var<uniform> gfu: GlobalFilterUniforms;\n@group(0) @binding(1) var uTexture: texture_2d<f32>;\n@group(0) @binding(2) var uSampler : sampler;\n\n@group(1) @binding(0) var<uniform> filterUniforms : MaskUniforms;\n@group(1) @binding(1) var uMaskTexture: texture_2d<f32>;\n\nstruct VSOutput {\n    @builtin(position) position: vec4<f32>,\n    @location(0) uv : vec2<f32>,\n    @location(1) filterUv : vec2<f32>,\n};\n\nfn filterVertexPosition(aPosition:vec2<f32>) -> vec4<f32>\n{\n    var position = aPosition * gfu.uOutputFrame.zw + gfu.uOutputFrame.xy;\n\n    position.x = position.x * (2.0 / gfu.uOutputTexture.x) - 1.0;\n    position.y = position.y * (2.0*gfu.uOutputTexture.z / gfu.uOutputTexture.y) - gfu.uOutputTexture.z;\n\n    return vec4(position, 0.0, 1.0);\n}\n\nfn filterTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>\n{\n    return aPosition * (gfu.uOutputFrame.zw * gfu.uInputSize.zw);\n}\n\nfn globalTextureCoord( aPosition:vec2<f32> ) -> vec2<f32>\n{\n  return  (aPosition.xy / gfu.uGlobalFrame.zw) + (gfu.uGlobalFrame.xy / gfu.uGlobalFrame.zw);\n}\n\nfn getFilterCoord(aPosition:vec2<f32> ) -> vec2<f32>\n{\n  return ( filterUniforms.uFilterMatrix * vec3( filterTextureCoord(aPosition), 1.0)  ).xy;\n}\n\nfn getSize() -> vec2<f32>\n{\n  return gfu.uGlobalFrame.zw;\n}\n\n@vertex\nfn mainVertex(\n  @location(0) aPosition : vec2<f32>,\n) -> VSOutput {\n  return VSOutput(\n   filterVertexPosition(aPosition),\n   filterTextureCoord(aPosition),\n   getFilterCoord(aPosition)\n  );\n}\n\n@fragment\nfn mainFragment(\n  @location(0) uv: vec2<f32>,\n  @location(1) filterUv: vec2<f32>,\n  @builtin(position) position: vec4<f32>\n) -> @location(0) vec4<f32> {\n\n    var maskClamp = filterUniforms.uMaskClamp;\n    var uAlpha = filterUniforms.uAlpha;\n\n    var clip = step(3.5,\n      step(maskClamp.x, filterUv.x) +\n      step(maskClamp.y, filterUv.y) +\n      step(filterUv.x, maskClamp.z) +\n      step(filterUv.y, maskClamp.w));\n\n    var mask = textureSample(uMaskTexture, uSampler, filterUv);\n    var source = textureSample(uTexture, uSampler, uv);\n    var alphaMul = 1.0 - uAlpha * (1.0 - mask.a);\n\n    var a: f32 = alphaMul * mask.r * uAlpha * clip;\n\n    if (filterUniforms.uInverse == 1.0) {\n        a = 1.0 - a;\n    }\n\n    return source * a;\n}\n";
;
 //# sourceMappingURL=mask.wgsl.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/mask/MaskFilter.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MaskFilter",
    ()=>MaskFilter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlProgram.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$GpuProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/GpuProgram.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UniformGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureMatrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TextureMatrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$Filter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/Filter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$mask$2f$mask$2e$frag$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/mask/mask.frag.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$mask$2f$mask$2e$vert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/mask/mask.vert.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$mask$2f$mask$2e$wgsl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/mask/mask.wgsl.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
"use strict";
class MaskFilter extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$Filter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Filter"] {
    constructor(options){
        const { sprite, ...rest } = options;
        const textureMatrix = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureMatrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureMatrix"](sprite.texture);
        const filterUniforms = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UniformGroup"]({
            uFilterMatrix: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"](),
                type: "mat3x3<f32>"
            },
            uMaskClamp: {
                value: textureMatrix.uClampFrame,
                type: "vec4<f32>"
            },
            uAlpha: {
                value: 1,
                type: "f32"
            },
            uInverse: {
                value: options.inverse ? 1 : 0,
                type: "f32"
            }
        });
        const gpuProgram = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$GpuProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuProgram"].from({
            vertex: {
                source: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$mask$2f$mask$2e$wgsl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"],
                entryPoint: "mainVertex"
            },
            fragment: {
                source: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$mask$2f$mask$2e$wgsl$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"],
                entryPoint: "mainFragment"
            }
        });
        const glProgram = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlProgram"].from({
            vertex: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$mask$2f$mask$2e$vert$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"],
            fragment: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$mask$2f$mask$2e$frag$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"],
            name: "mask-filter"
        });
        super({
            ...rest,
            gpuProgram,
            glProgram,
            clipToViewport: false,
            resources: {
                filterUniforms,
                uMaskTexture: sprite.texture.source
            }
        });
        this.sprite = sprite;
        this._textureMatrix = textureMatrix;
    }
    set inverse(value) {
        this.resources.filterUniforms.uniforms.uInverse = value ? 1 : 0;
    }
    get inverse() {
        return this.resources.filterUniforms.uniforms.uInverse === 1;
    }
    apply(filterManager, input, output, clearMode) {
        this._textureMatrix.texture = this.sprite.texture;
        filterManager.calculateSpriteMatrix(this.resources.filterUniforms.uniforms.uFilterMatrix, this.sprite).prepend(this._textureMatrix.mapCoord);
        this.resources.uMaskTexture = this.sprite.texture.source;
        filterManager.applyFilter(this, input, output, clearMode);
    }
}
;
 //# sourceMappingURL=MaskFilter.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/alpha/AlphaMaskPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AlphaMaskPipe",
    ()=>AlphaMaskPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$FilterEffect$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/FilterEffect.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$mask$2f$MaskFilter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/mask/MaskFilter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/Bounds.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getGlobalBounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/getGlobalBounds.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$Sprite$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite/Sprite.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/PoolGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TexturePool.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/types.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
"use strict";
const tempBounds = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Bounds"]();
class AlphaMaskEffect extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$FilterEffect$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FilterEffect"] {
    constructor(){
        super();
        this.filters = [
            new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$mask$2f$MaskFilter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["MaskFilter"]({
                sprite: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$Sprite$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Sprite"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"].EMPTY),
                inverse: false,
                resolution: "inherit",
                antialias: "inherit"
            })
        ];
    }
    get sprite() {
        return this.filters[0].sprite;
    }
    set sprite(value) {
        this.filters[0].sprite = value;
    }
    get inverse() {
        return this.filters[0].inverse;
    }
    set inverse(value) {
        this.filters[0].inverse = value;
    }
}
class AlphaMaskPipe {
    constructor(renderer){
        this._activeMaskStage = [];
        this._renderer = renderer;
    }
    push(mask, maskedContainer, instructionSet) {
        const renderer = this._renderer;
        renderer.renderPipes.batch.break(instructionSet);
        instructionSet.add({
            renderPipeId: "alphaMask",
            action: "pushMaskBegin",
            mask,
            inverse: maskedContainer._maskOptions.inverse,
            canBundle: false,
            maskedContainer
        });
        mask.inverse = maskedContainer._maskOptions.inverse;
        if (mask.renderMaskToTexture) {
            const maskContainer = mask.mask;
            maskContainer.includeInBuild = true;
            maskContainer.collectRenderables(instructionSet, renderer, null);
            maskContainer.includeInBuild = false;
        }
        renderer.renderPipes.batch.break(instructionSet);
        instructionSet.add({
            renderPipeId: "alphaMask",
            action: "pushMaskEnd",
            mask,
            maskedContainer,
            inverse: maskedContainer._maskOptions.inverse,
            canBundle: false
        });
    }
    pop(mask, _maskedContainer, instructionSet) {
        const renderer = this._renderer;
        renderer.renderPipes.batch.break(instructionSet);
        instructionSet.add({
            renderPipeId: "alphaMask",
            action: "popMaskEnd",
            mask,
            inverse: _maskedContainer._maskOptions.inverse,
            canBundle: false
        });
    }
    execute(instruction) {
        const renderer = this._renderer;
        const renderMask = instruction.mask.renderMaskToTexture;
        if (instruction.action === "pushMaskBegin") {
            const filterEffect = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BigPool"].get(AlphaMaskEffect);
            filterEffect.inverse = instruction.inverse;
            if (renderMask) {
                instruction.mask.mask.measurable = true;
                const bounds = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getGlobalBounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getGlobalBounds"])(instruction.mask.mask, true, tempBounds);
                instruction.mask.mask.measurable = false;
                bounds.ceil();
                const colorTextureSource = renderer.renderTarget.renderTarget.colorTexture.source;
                const filterTexture = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].getOptimalTexture(bounds.width, bounds.height, colorTextureSource._resolution, colorTextureSource.antialias);
                renderer.renderTarget.push(filterTexture, true);
                renderer.globalUniforms.push({
                    offset: bounds,
                    worldColor: 4294967295
                });
                const sprite = filterEffect.sprite;
                sprite.texture = filterTexture;
                sprite.worldTransform.tx = bounds.minX;
                sprite.worldTransform.ty = bounds.minY;
                this._activeMaskStage.push({
                    filterEffect,
                    maskedContainer: instruction.maskedContainer,
                    filterTexture
                });
            } else {
                filterEffect.sprite = instruction.mask.mask;
                this._activeMaskStage.push({
                    filterEffect,
                    maskedContainer: instruction.maskedContainer
                });
            }
        } else if (instruction.action === "pushMaskEnd") {
            const maskData = this._activeMaskStage[this._activeMaskStage.length - 1];
            if (renderMask) {
                if (renderer.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RendererType"].WEBGL) {
                    renderer.renderTarget.finishRenderPass();
                }
                renderer.renderTarget.pop();
                renderer.globalUniforms.pop();
            }
            renderer.filter.push({
                renderPipeId: "filter",
                action: "pushFilter",
                container: maskData.maskedContainer,
                filterEffect: maskData.filterEffect,
                canBundle: false
            });
        } else if (instruction.action === "popMaskEnd") {
            renderer.filter.pop();
            const maskData = this._activeMaskStage.pop();
            if (renderMask) {
                __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TexturePool$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TexturePool"].returnTexture(maskData.filterTexture);
            }
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$PoolGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BigPool"].return(maskData.filterEffect);
        }
    }
    destroy() {
        this._renderer = null;
        this._activeMaskStage = null;
    }
}
/** @ignore */ AlphaMaskPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "alphaMask"
};
;
 //# sourceMappingURL=AlphaMaskPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/color/ColorMaskPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ColorMaskPipe",
    ()=>ColorMaskPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
;
"use strict";
class ColorMaskPipe {
    constructor(renderer){
        this._colorStack = [];
        this._colorStackIndex = 0;
        this._currentColor = 0;
        this._renderer = renderer;
    }
    buildStart() {
        this._colorStack[0] = 15;
        this._colorStackIndex = 1;
        this._currentColor = 15;
    }
    push(mask, _container, instructionSet) {
        const renderer = this._renderer;
        renderer.renderPipes.batch.break(instructionSet);
        const colorStack = this._colorStack;
        colorStack[this._colorStackIndex] = colorStack[this._colorStackIndex - 1] & mask.mask;
        const currentColor = this._colorStack[this._colorStackIndex];
        if (currentColor !== this._currentColor) {
            this._currentColor = currentColor;
            instructionSet.add({
                renderPipeId: "colorMask",
                colorMask: currentColor,
                canBundle: false
            });
        }
        this._colorStackIndex++;
    }
    pop(_mask, _container, instructionSet) {
        const renderer = this._renderer;
        renderer.renderPipes.batch.break(instructionSet);
        const colorStack = this._colorStack;
        this._colorStackIndex--;
        const currentColor = colorStack[this._colorStackIndex - 1];
        if (currentColor !== this._currentColor) {
            this._currentColor = currentColor;
            instructionSet.add({
                renderPipeId: "colorMask",
                colorMask: currentColor,
                canBundle: false
            });
        }
    }
    execute(instruction) {
        const renderer = this._renderer;
        renderer.colorMask.setMask(instruction.colorMask);
    }
    destroy() {
        this._renderer = null;
        this._colorStack = null;
    }
}
/** @ignore */ ColorMaskPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "colorMask"
};
;
 //# sourceMappingURL=ColorMaskPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/stencil/StencilMaskPipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "StencilMaskPipe",
    ()=>StencilMaskPipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/const.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/const.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
class StencilMaskPipe {
    constructor(renderer){
        // used when building and also when executing..
        this._maskStackHash = {};
        this._maskHash = /* @__PURE__ */ new WeakMap();
        this._renderer = renderer;
    }
    push(mask, _container, instructionSet) {
        var _a;
        const effect = mask;
        const renderer = this._renderer;
        renderer.renderPipes.batch.break(instructionSet);
        renderer.renderPipes.blendMode.setBlendMode(effect.mask, "none", instructionSet);
        instructionSet.add({
            renderPipeId: "stencilMask",
            action: "pushMaskBegin",
            mask,
            inverse: _container._maskOptions.inverse,
            canBundle: false
        });
        const maskContainer = effect.mask;
        maskContainer.includeInBuild = true;
        if (!this._maskHash.has(effect)) {
            this._maskHash.set(effect, {
                instructionsStart: 0,
                instructionsLength: 0
            });
        }
        const maskData = this._maskHash.get(effect);
        maskData.instructionsStart = instructionSet.instructionSize;
        maskContainer.collectRenderables(instructionSet, renderer, null);
        maskContainer.includeInBuild = false;
        renderer.renderPipes.batch.break(instructionSet);
        instructionSet.add({
            renderPipeId: "stencilMask",
            action: "pushMaskEnd",
            mask,
            inverse: _container._maskOptions.inverse,
            canBundle: false
        });
        const instructionsLength = instructionSet.instructionSize - maskData.instructionsStart - 1;
        maskData.instructionsLength = instructionsLength;
        const renderTargetUid = renderer.renderTarget.renderTarget.uid;
        (_a = this._maskStackHash)[renderTargetUid] ?? (_a[renderTargetUid] = 0);
    }
    pop(mask, _container, instructionSet) {
        const effect = mask;
        const renderer = this._renderer;
        renderer.renderPipes.batch.break(instructionSet);
        renderer.renderPipes.blendMode.setBlendMode(effect.mask, "none", instructionSet);
        instructionSet.add({
            renderPipeId: "stencilMask",
            action: "popMaskBegin",
            inverse: _container._maskOptions.inverse,
            canBundle: false
        });
        const maskData = this._maskHash.get(mask);
        for(let i = 0; i < maskData.instructionsLength; i++){
            instructionSet.instructions[instructionSet.instructionSize++] = instructionSet.instructions[maskData.instructionsStart++];
        }
        instructionSet.add({
            renderPipeId: "stencilMask",
            action: "popMaskEnd",
            canBundle: false
        });
    }
    execute(instruction) {
        var _a;
        const renderer = this._renderer;
        const renderTargetUid = renderer.renderTarget.renderTarget.uid;
        let maskStackIndex = (_a = this._maskStackHash)[renderTargetUid] ?? (_a[renderTargetUid] = 0);
        if (instruction.action === "pushMaskBegin") {
            renderer.renderTarget.ensureDepthStencil();
            renderer.stencil.setStencilMode(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].RENDERING_MASK_ADD, maskStackIndex);
            maskStackIndex++;
            renderer.colorMask.setMask(0);
        } else if (instruction.action === "pushMaskEnd") {
            if (instruction.inverse) {
                renderer.stencil.setStencilMode(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].INVERSE_MASK_ACTIVE, maskStackIndex);
            } else {
                renderer.stencil.setStencilMode(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].MASK_ACTIVE, maskStackIndex);
            }
            renderer.colorMask.setMask(15);
        } else if (instruction.action === "popMaskBegin") {
            renderer.colorMask.setMask(0);
            if (maskStackIndex !== 0) {
                renderer.stencil.setStencilMode(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].RENDERING_MASK_REMOVE, maskStackIndex);
            } else {
                renderer.renderTarget.clear(null, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLEAR"].STENCIL);
                renderer.stencil.setStencilMode(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].DISABLED, maskStackIndex);
            }
            maskStackIndex--;
        } else if (instruction.action === "popMaskEnd") {
            if (instruction.inverse) {
                renderer.stencil.setStencilMode(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].INVERSE_MASK_ACTIVE, maskStackIndex);
            } else {
                renderer.stencil.setStencilMode(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].MASK_ACTIVE, maskStackIndex);
            }
            renderer.colorMask.setMask(15);
        }
        this._maskStackHash[renderTargetUid] = maskStackIndex;
    }
    destroy() {
        this._renderer = null;
        this._maskStackHash = null;
        this._maskHash = null;
    }
}
StencilMaskPipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "stencilMask"
};
;
 //# sourceMappingURL=StencilMaskPipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/background/BackgroundSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BackgroundSystem",
    ()=>BackgroundSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/color/Color.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
const _BackgroundSystem = class _BackgroundSystem {
    constructor(){
        this.clearBeforeRender = true;
        this._backgroundColor = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"](0);
        this.color = this._backgroundColor;
        this.alpha = 1;
    }
    /**
   * initiates the background system
   * @param options - the options for the background colors
   */ init(options) {
        options = {
            ..._BackgroundSystem.defaultOptions,
            ...options
        };
        this.clearBeforeRender = options.clearBeforeRender;
        this.color = options.background || options.backgroundColor || this._backgroundColor;
        this.alpha = options.backgroundAlpha;
        this._backgroundColor.setAlpha(options.backgroundAlpha);
    }
    /** The background color to fill if not transparent */ get color() {
        return this._backgroundColor;
    }
    set color(value) {
        const incoming = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"].shared.setValue(value);
        if (incoming.alpha < 1 && this._backgroundColor.alpha === 1) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("Cannot set a transparent background on an opaque canvas. To enable transparency, set backgroundAlpha < 1 when initializing your Application.");
        }
        this._backgroundColor.setValue(value);
    }
    /** The background color alpha. Setting this to 0 will make the canvas transparent. */ get alpha() {
        return this._backgroundColor.alpha;
    }
    set alpha(value) {
        this._backgroundColor.setAlpha(value);
    }
    /** The background color as an [R, G, B, A] array. */ get colorRgba() {
        return this._backgroundColor.toArray();
    }
    /**
   * destroys the background system
   * @internal
   */ destroy() {}
};
/** @ignore */ _BackgroundSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasSystem
    ],
    name: "background",
    priority: 0
};
/** default options used by the system */ _BackgroundSystem.defaultOptions = {
    /**
   * {@link WebGLOptions.backgroundAlpha}
   * @default 1
   */ backgroundAlpha: 1,
    /**
   * {@link WebGLOptions.backgroundColor}
   * @default 0x000000
   */ backgroundColor: 0,
    /**
   * {@link WebGLOptions.clearBeforeRender}
   * @default true
   */ clearBeforeRender: true
};
let BackgroundSystem = _BackgroundSystem;
;
 //# sourceMappingURL=BackgroundSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/blendModes/BlendModePipe.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BlendModePipe",
    ()=>BlendModePipe
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$FilterEffect$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/filters/FilterEffect.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$RenderGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/RenderGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
;
;
;
;
"use strict";
const BLEND_MODE_FILTERS = {};
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].handle(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].BlendMode, (value)=>{
    if (!value.name) {
        throw new Error("BlendMode extension must have a name property");
    }
    BLEND_MODE_FILTERS[value.name] = value.ref;
}, (value)=>{
    delete BLEND_MODE_FILTERS[value.name];
});
class BlendModePipe {
    constructor(renderer){
        this._blendModeStack = [];
        this._isAdvanced = false;
        this._filterHash = /* @__PURE__ */ Object.create(null);
        this._renderer = renderer;
        this._renderer.runners.prerender.add(this);
    }
    prerender() {
        this._activeBlendMode = "normal";
        this._isAdvanced = false;
    }
    /**
   * Push a blend mode onto the internal stack and apply it to the instruction set if needed.
   * @param renderable - The renderable or {@link RenderGroup} associated with the change.
   * @param blendMode - The blend mode to activate.
   * @param instructionSet - The instruction set being built.
   */ pushBlendMode(renderable, blendMode, instructionSet) {
        this._blendModeStack.push(blendMode);
        this.setBlendMode(renderable, blendMode, instructionSet);
    }
    /**
   * Pop the last blend mode from the stack and apply the new top-of-stack mode.
   * @param instructionSet - The instruction set being built.
   */ popBlendMode(instructionSet) {
        this._blendModeStack.pop();
        const blendMode = this._blendModeStack[this._activeBlendMode.length - 1] ?? "normal";
        this.setBlendMode(null, blendMode, instructionSet);
    }
    /**
   * Ensure a blend mode switch is added to the instruction set when the mode changes.
   * If an advanced blend mode is active, subsequent renderables will be collected so they can be
   * rendered within a single filter pass.
   * @param renderable - The renderable or {@link RenderGroup} to associate with the change, or null when unwinding.
   * @param blendMode - The target blend mode.
   * @param instructionSet - The instruction set being built.
   */ setBlendMode(renderable, blendMode, instructionSet) {
        const isRenderGroup = renderable instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$RenderGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderGroup"];
        if (this._activeBlendMode === blendMode) {
            if (this._isAdvanced && renderable && !isRenderGroup) {
                this._renderableList?.push(renderable);
            }
            return;
        }
        if (this._isAdvanced) this._endAdvancedBlendMode(instructionSet);
        this._activeBlendMode = blendMode;
        if (!renderable) return;
        this._isAdvanced = !!BLEND_MODE_FILTERS[blendMode];
        if (this._isAdvanced) this._beginAdvancedBlendMode(renderable, instructionSet);
    }
    _beginAdvancedBlendMode(renderable, instructionSet) {
        this._renderer.renderPipes.batch.break(instructionSet);
        const blendMode = this._activeBlendMode;
        if (!BLEND_MODE_FILTERS[blendMode]) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])(`Unable to assign BlendMode: '${blendMode}'. You may want to include: import 'pixi.js/advanced-blend-modes'`);
            return;
        }
        const filterEffect = this._ensureFilterEffect(blendMode);
        const isRenderGroup = renderable instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$RenderGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderGroup"];
        const instruction = {
            renderPipeId: "filter",
            action: "pushFilter",
            filterEffect,
            renderables: isRenderGroup ? null : [
                renderable
            ],
            container: isRenderGroup ? renderable.root : null,
            canBundle: false
        };
        this._renderableList = instruction.renderables;
        instructionSet.add(instruction);
    }
    _ensureFilterEffect(blendMode) {
        let filterEffect = this._filterHash[blendMode];
        if (!filterEffect) {
            filterEffect = this._filterHash[blendMode] = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$filters$2f$FilterEffect$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FilterEffect"]();
            filterEffect.filters = [
                new BLEND_MODE_FILTERS[blendMode]()
            ];
        }
        return filterEffect;
    }
    _endAdvancedBlendMode(instructionSet) {
        this._isAdvanced = false;
        this._renderableList = null;
        this._renderer.renderPipes.batch.break(instructionSet);
        instructionSet.add({
            renderPipeId: "filter",
            action: "popFilter",
            canBundle: false
        });
    }
    /**
   * called when the instruction build process is starting this will reset internally to the default blend mode
   * @internal
   */ buildStart() {
        this._isAdvanced = false;
    }
    /**
   * called when the instruction build process is finished, ensuring that if there is an advanced blend mode
   * active, we add the final render instructions added to the instruction set
   * @param instructionSet - The instruction set we are adding to
   * @internal
   */ buildEnd(instructionSet) {
        if (!this._isAdvanced) return;
        this._endAdvancedBlendMode(instructionSet);
    }
    /** @internal */ destroy() {
        this._renderer = null;
        this._renderableList = null;
        for(const i in this._filterHash){
            this._filterHash[i].destroy();
        }
        this._filterHash = null;
    }
}
/** @ignore */ BlendModePipe.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUPipes,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasPipes
    ],
    name: "blendMode"
};
;
 //# sourceMappingURL=BlendModePipe.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/extract/ExtractSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ExtractSystem",
    ()=>ExtractSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/Container.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
;
;
;
;
"use strict";
const imageTypes = {
    png: "image/png",
    jpg: "image/jpeg",
    webp: "image/webp"
};
const _ExtractSystem = class _ExtractSystem {
    /** @param renderer - The renderer this System works for. */ constructor(renderer){
        this._renderer = renderer;
    }
    _normalizeOptions(options, defaults = {}) {
        if (options instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Container"] || options instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"]) {
            return {
                target: options,
                ...defaults
            };
        }
        return {
            ...defaults,
            ...options
        };
    }
    /**
   * Creates an IImage from a display object or texture.
   * @param options - Options for creating the image, or the target to extract
   * @returns Promise that resolves with the generated IImage
   * @example
   * ```ts
   * // Basic usage with a sprite
   * const sprite = new Sprite(texture);
   * const image = await renderer.extract.image(sprite);
   * document.body.appendChild(image);
   *
   * // Advanced usage with options
   * const image = await renderer.extract.image({
   *     target: container,
   *     format: 'webp',
   *     quality: 0.8,
   *     frame: new Rectangle(0, 0, 100, 100),
   *     resolution: 2,
   *     clearColor: '#ff0000',
   *     antialias: true
   * });
   *
   * // Extract directly from a texture
   * const texture = Texture.from('myTexture.png');
   * const image = await renderer.extract.image(texture);
   * ```
   * @see {@link ExtractImageOptions} For detailed options
   * @see {@link ExtractSystem.base64} For base64 string output
   * @see {@link ExtractSystem.canvas} For canvas output
   * @see {@link ImageLike} For the image interface
   * @category rendering
   */ async image(options) {
        const image = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createImage();
        image.src = await this.base64(options);
        return image;
    }
    /**
   * Converts the target into a base64 encoded string.
   *
   * This method works by first creating
   * a canvas using `Extract.canvas` and then converting it to a base64 string.
   * @param options - The options for creating the base64 string, or the target to extract
   * @returns Promise that resolves with the base64 encoded string
   * @example
   * ```ts
   * // Basic usage with a sprite
   * const sprite = new Sprite(texture);
   * const base64 = await renderer.extract.base64(sprite);
   * console.log(base64); // data:image/png;base64,...
   *
   * // Advanced usage with options
   * const base64 = await renderer.extract.base64({
   *     target: container,
   *     format: 'webp',
   *     quality: 0.8,
   *     frame: new Rectangle(0, 0, 100, 100),
   *     resolution: 2
   * });
   * ```
   * @throws Will throw an error if the platform doesn't support any of:
   * - ICanvas.toDataURL
   * - ICanvas.toBlob
   * - ICanvas.convertToBlob
   * @see {@link ExtractImageOptions} For detailed options
   * @see {@link ExtractSystem.canvas} For canvas output
   * @see {@link ExtractSystem.image} For HTMLImage output
   * @category rendering
   */ async base64(options) {
        options = this._normalizeOptions(options, _ExtractSystem.defaultImageOptions);
        const { format, quality } = options;
        const canvas = this.canvas(options);
        if (canvas.toBlob !== void 0) {
            return new Promise((resolve, reject)=>{
                canvas.toBlob((blob)=>{
                    if (!blob) {
                        reject(new Error("ICanvas.toBlob failed!"));
                        return;
                    }
                    const reader = new FileReader();
                    reader.onload = ()=>resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                }, imageTypes[format], quality);
            });
        }
        if (canvas.toDataURL !== void 0) {
            return canvas.toDataURL(imageTypes[format], quality);
        }
        if (canvas.convertToBlob !== void 0) {
            const blob = await canvas.convertToBlob({
                type: imageTypes[format],
                quality
            });
            return new Promise((resolve, reject)=>{
                const reader = new FileReader();
                reader.onload = ()=>resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }
        throw new Error("Extract.base64() requires ICanvas.toDataURL, ICanvas.toBlob, or ICanvas.convertToBlob to be implemented");
    }
    /**
   * Creates a Canvas element, renders the target to it and returns it.
   * This method is useful for creating static images or when you need direct canvas access.
   * @param options - The options for creating the canvas, or the target to extract
   * @returns A Canvas element with the texture rendered on
   * @example
   * ```ts
   * // Basic canvas extraction from a sprite
   * const sprite = new Sprite(texture);
   * const canvas = renderer.extract.canvas(sprite);
   * document.body.appendChild(canvas);
   *
   * // Extract with custom region
   * const canvas = renderer.extract.canvas({
   *     target: container,
   *     frame: new Rectangle(0, 0, 100, 100)
   * });
   *
   * // Extract with high resolution
   * const canvas = renderer.extract.canvas({
   *     target: sprite,
   *     resolution: 2,
   *     clearColor: '#ff0000'
   * });
   *
   * // Extract directly from a texture
   * const texture = Texture.from('myTexture.png');
   * const canvas = renderer.extract.canvas(texture);
   *
   * // Extract with anti-aliasing
   * const canvas = renderer.extract.canvas({
   *     target: graphics,
   *     antialias: true
   * });
   * ```
   * @see {@link ExtractOptions} For detailed options
   * @see {@link ExtractSystem.image} For HTMLImage output
   * @see {@link ExtractSystem.pixels} For raw pixel data
   * @category rendering
   */ canvas(options) {
        options = this._normalizeOptions(options);
        const target = options.target;
        const renderer = this._renderer;
        if (target instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"]) {
            return renderer.texture.generateCanvas(target);
        }
        const texture = renderer.textureGenerator.generateTexture(options);
        const canvas = renderer.texture.generateCanvas(texture);
        texture.destroy(true);
        return canvas;
    }
    /**
   * Returns a one-dimensional array containing the pixel data of the entire texture in RGBA order,
   * with integer values between 0 and 255 (inclusive).
   * > [!NOE] The returned array is a flat Uint8Array where every 4 values represent RGBA
   * @param options - The options for extracting the image, or the target to extract
   * @returns One-dimensional Uint8Array containing the pixel data in RGBA format
   * @example
   * ```ts
   * // Basic pixel extraction
   * const sprite = new Sprite(texture);
   * const pixels = renderer.extract.pixels(sprite);
   * console.log(pixels[0], pixels[1], pixels[2], pixels[3]); // R,G,B,A values
   *
   * // Extract with custom region
   * const pixels = renderer.extract.pixels({
   *     target: sprite,
   *     frame: new Rectangle(0, 0, 100, 100)
   * });
   *
   * // Extract with high resolution
   * const pixels = renderer.extract.pixels({
   *     target: sprite,
   *     resolution: 2
   * });
   * ```
   * @see {@link ExtractOptions} For detailed options
   * @see {@link ExtractSystem.canvas} For canvas output
   * @see {@link ExtractSystem.image} For image output
   * @category rendering
   */ pixels(options) {
        options = this._normalizeOptions(options);
        const target = options.target;
        const renderer = this._renderer;
        const texture = target instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"] ? target : renderer.textureGenerator.generateTexture(options);
        const pixelInfo = renderer.texture.getPixels(texture);
        if (target instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Container"]) {
            texture.destroy(true);
        }
        return pixelInfo;
    }
    /**
   * Creates a texture from a display object or existing texture.
   *
   * This is useful for creating
   * reusable textures from rendered content or making copies of existing textures.
   * > [!NOTE] The returned texture should be destroyed when no longer needed
   * @param options - The options for creating the texture, or the target to extract
   * @returns A new texture containing the extracted content
   * @example
   * ```ts
   * // Basic texture extraction from a sprite
   * const sprite = new Sprite(texture);
   * const extractedTexture = renderer.extract.texture(sprite);
   *
   * // Extract with custom region
   * const regionTexture = renderer.extract.texture({
   *     target: container,
   *     frame: new Rectangle(0, 0, 100, 100)
   * });
   *
   * // Extract with high resolution
   * const hiResTexture = renderer.extract.texture({
   *     target: sprite,
   *     resolution: 2,
   *     clearColor: '#ff0000'
   * });
   *
   * // Create a new sprite from extracted texture
   * const newSprite = new Sprite(
   *     renderer.extract.texture({
   *         target: graphics,
   *         antialias: true
   *     })
   * );
   *
   * // Clean up when done
   * extractedTexture.destroy(true);
   * ```
   * @see {@link ExtractOptions} For detailed options
   * @see {@link Texture} For texture management
   * @see {@link GenerateTextureSystem} For texture generation
   * @category rendering
   */ texture(options) {
        options = this._normalizeOptions(options);
        if (options.target instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"]) return options.target;
        return this._renderer.textureGenerator.generateTexture(options);
    }
    /**
   * Extracts and downloads content from the renderer as an image file.
   * This is a convenient way to save screenshots or export rendered content.
   * > [!NOTE] The download will use PNG format regardless of the filename extension
   * @param options - The options for downloading and extracting the image, or the target to extract
   * @example
   * ```ts
   * // Basic download with default filename
   * const sprite = new Sprite(texture);
   * renderer.extract.download(sprite); // Downloads as 'image.png'
   *
   * // Download with custom filename
   * renderer.extract.download({
   *     target: sprite,
   *     filename: 'screenshot.png'
   * });
   *
   * // Download with custom region
   * renderer.extract.download({
   *     target: container,
   *     filename: 'region.png',
   *     frame: new Rectangle(0, 0, 100, 100)
   * });
   *
   * // Download with high resolution and background
   * renderer.extract.download({
   *     target: stage,
   *     filename: 'hd-screenshot.png',
   *     resolution: 2,
   *     clearColor: '#ff0000'
   * });
   *
   * // Download with anti-aliasing
   * renderer.extract.download({
   *     target: graphics,
   *     filename: 'smooth.png',
   *     antialias: true
   * });
   * ```
   * @see {@link ExtractDownloadOptions} For detailed options
   * @see {@link ExtractSystem.image} For creating images without download
   * @see {@link ExtractSystem.canvas} For canvas output
   * @category rendering
   */ download(options) {
        options = this._normalizeOptions(options);
        const canvas = this.canvas(options);
        const link = document.createElement("a");
        link.download = options.filename ?? "image.png";
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    /**
   * Logs the target to the console as an image. This is a useful way to debug what's happening in the renderer.
   * The image will be displayed in the browser's console using CSS background images.
   * @param options - The options for logging the image, or the target to log
   * @param options.width - The width of the logged image preview in the console (in pixels)
   * @example
   * ```ts
   * // Basic usage
   * const sprite = new Sprite(texture);
   * renderer.extract.log(sprite);
   * ```
   * @see {@link ExtractSystem.canvas} For getting raw canvas output
   * @see {@link ExtractSystem.pixels} For raw pixel data
   * @category rendering
   * @advanced
   */ log(options) {
        const width = options.width ?? 200;
        options = this._normalizeOptions(options);
        const canvas = this.canvas(options);
        const base64 = canvas.toDataURL();
        console.log(`[Pixi Texture] ${canvas.width}px ${canvas.height}px`);
        const style = [
            "font-size: 1px;",
            `padding: ${width}px ${300}px;`,
            `background: url(${base64}) no-repeat;`,
            "background-size: contain;"
        ].join(" ");
        console.log("%c ", style);
    }
    destroy() {
        this._renderer = null;
    }
};
/** @ignore */ _ExtractSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "extract"
};
/**
 * Default options for image extraction.
 * @example
 * ```ts
 * // Customize default options
 * ExtractSystem.defaultImageOptions.format = 'webp';
 * ExtractSystem.defaultImageOptions.quality = 0.8;
 *
 * // Use defaults
 * const image = await renderer.extract.image(sprite);
 * ```
 */ _ExtractSystem.defaultImageOptions = {
    format: "png",
    quality: 1
};
let ExtractSystem = _ExtractSystem;
;
 //# sourceMappingURL=ExtractSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/RenderTexture.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RenderTexture",
    ()=>RenderTexture
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/TextureSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
class RenderTexture extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"] {
    static create(options) {
        return new RenderTexture({
            source: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureSource"](options)
        });
    }
    /**
   * Resizes the render texture.
   * @param width - The new width of the render texture.
   * @param height - The new height of the render texture.
   * @param resolution - The new resolution of the render texture.
   * @returns This texture.
   */ resize(width, height, resolution) {
        this.source.resize(width, height, resolution);
        return this;
    }
}
;
 //# sourceMappingURL=RenderTexture.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/extract/GenerateTextureSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GenerateTextureSystem",
    ()=>GenerateTextureSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/color/Color.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/Bounds.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getLocalBounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/bounds/getLocalBounds.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/Container.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$RenderTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/RenderTexture.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
"use strict";
const tempRect = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Rectangle"]();
const tempBounds = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$Bounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Bounds"]();
const noColor = [
    0,
    0,
    0,
    0
];
class GenerateTextureSystem {
    constructor(renderer){
        this._renderer = renderer;
    }
    /**
   * Creates a texture from a display object that can be used for creating sprites and other textures.
   * This is particularly useful for optimizing performance when a complex container needs to be reused.
   * @param options - Generate texture options or a container to convert to texture
   * @returns A new RenderTexture containing the rendered display object
   * @example
   * ```ts
   * // Basic usage with a container
   * const container = new Container();
   * container.addChild(
   *     new Graphics()
   *         .circle(0, 0, 50)
   *         .fill('red')
   * );
   *
   * const texture = renderer.textureGenerator.generateTexture(container);
   *
   * // Advanced usage with options
   * const texture = renderer.textureGenerator.generateTexture({
   *     target: container,
   *     frame: new Rectangle(0, 0, 100, 100), // Specific region
   *     resolution: 2,                        // High DPI
   *     clearColor: '#ff0000',               // Red background
   *     antialias: true                      // Smooth edges
   * });
   *
   * // Create a sprite from the generated texture
   * const sprite = new Sprite(texture);
   *
   * // Clean up when done
   * texture.destroy(true);
   * ```
   * @see {@link GenerateTextureOptions} For detailed texture generation options
   * @see {@link RenderTexture} For the type of texture created
   * @category rendering
   */ generateTexture(options) {
        if (options instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$Container$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Container"]) {
            options = {
                target: options,
                frame: void 0,
                textureSourceOptions: {},
                resolution: void 0
            };
        }
        const resolution = options.resolution || this._renderer.resolution;
        const antialias = options.antialias || this._renderer.view.antialias;
        const container = options.target;
        let clearColor = options.clearColor;
        if (clearColor) {
            const isRGBAArray = Array.isArray(clearColor) && clearColor.length === 4;
            clearColor = isRGBAArray ? clearColor : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$color$2f$Color$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Color"].shared.setValue(clearColor).toArray();
        } else {
            clearColor = noColor;
        }
        const region = options.frame?.copyTo(tempRect) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$bounds$2f$getLocalBounds$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getLocalBounds"])(container, tempBounds).rectangle;
        region.width = Math.max(region.width, 1 / resolution) | 0;
        region.height = Math.max(region.height, 1 / resolution) | 0;
        const target = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$RenderTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderTexture"].create({
            ...options.textureSourceOptions,
            width: region.width,
            height: region.height,
            resolution,
            antialias
        });
        const transform = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"].shared.translate(-region.x, -region.y);
        this._renderer.render({
            container,
            transform,
            target,
            clearColor
        });
        target.source.updateMipmaps();
        return target;
    }
    destroy() {
        this._renderer = null;
    }
}
/** @ignore */ GenerateTextureSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "textureGenerator"
};
;
 //# sourceMappingURL=GenerateTextureSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/gpu/colorToUniform.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "color32BitToUniform",
    ()=>color32BitToUniform,
    "colorToUniform",
    ()=>colorToUniform
]);
"use strict";
function colorToUniform(rgb, alpha, out, offset) {
    out[offset++] = (rgb >> 16 & 255) / 255;
    out[offset++] = (rgb >> 8 & 255) / 255;
    out[offset++] = (rgb & 255) / 255;
    out[offset++] = alpha;
}
function color32BitToUniform(abgr, out, offset) {
    const alpha = (abgr >> 24 & 255) / 255;
    out[offset++] = (abgr & 255) / 255 * alpha;
    out[offset++] = (abgr >> 8 & 255) / 255 * alpha;
    out[offset++] = (abgr >> 16 & 255) / 255 * alpha;
    out[offset++] = alpha;
}
;
 //# sourceMappingURL=colorToUniform.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/renderTarget/GlobalUniformSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlobalUniformSystem",
    ()=>GlobalUniformSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/point/Point.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$gpu$2f$colorToUniform$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/gpu/colorToUniform.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$BindGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/shader/BindGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/types.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UniformGroup.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
"use strict";
class GlobalUniformSystem {
    constructor(renderer){
        this._stackIndex = 0;
        this._globalUniformDataStack = [];
        this._uniformsPool = [];
        this._activeUniforms = [];
        this._bindGroupPool = [];
        this._activeBindGroups = [];
        this._renderer = renderer;
    }
    reset() {
        this._stackIndex = 0;
        for(let i = 0; i < this._activeUniforms.length; i++){
            this._uniformsPool.push(this._activeUniforms[i]);
        }
        for(let i = 0; i < this._activeBindGroups.length; i++){
            this._bindGroupPool.push(this._activeBindGroups[i]);
        }
        this._activeUniforms.length = 0;
        this._activeBindGroups.length = 0;
    }
    start(options) {
        this.reset();
        this.push(options);
    }
    bind({ size, projectionMatrix, worldTransformMatrix, worldColor, offset }) {
        const renderTarget = this._renderer.renderTarget.renderTarget;
        const currentGlobalUniformData = this._stackIndex ? this._globalUniformDataStack[this._stackIndex - 1] : {
            projectionData: renderTarget,
            worldTransformMatrix: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"](),
            worldColor: 4294967295,
            offset: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$point$2f$Point$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Point"]()
        };
        const globalUniformData = {
            projectionMatrix: projectionMatrix || this._renderer.renderTarget.projectionMatrix,
            resolution: size || renderTarget.size,
            worldTransformMatrix: worldTransformMatrix || currentGlobalUniformData.worldTransformMatrix,
            worldColor: worldColor || currentGlobalUniformData.worldColor,
            offset: offset || currentGlobalUniformData.offset,
            bindGroup: null
        };
        const uniformGroup = this._uniformsPool.pop() || this._createUniforms();
        this._activeUniforms.push(uniformGroup);
        const uniforms = uniformGroup.uniforms;
        uniforms.uProjectionMatrix = globalUniformData.projectionMatrix;
        uniforms.uResolution = globalUniformData.resolution;
        uniforms.uWorldTransformMatrix.copyFrom(globalUniformData.worldTransformMatrix);
        uniforms.uWorldTransformMatrix.tx -= globalUniformData.offset.x;
        uniforms.uWorldTransformMatrix.ty -= globalUniformData.offset.y;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$gpu$2f$colorToUniform$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["color32BitToUniform"])(globalUniformData.worldColor, uniforms.uWorldColorAlpha, 0);
        uniformGroup.update();
        let bindGroup;
        if (this._renderer.renderPipes.uniformBatch) {
            bindGroup = this._renderer.renderPipes.uniformBatch.getUniformBindGroup(uniformGroup, false);
        } else {
            bindGroup = this._bindGroupPool.pop() || new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$shader$2f$BindGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BindGroup"]();
            this._activeBindGroups.push(bindGroup);
            bindGroup.setResource(uniformGroup, 0);
        }
        globalUniformData.bindGroup = bindGroup;
        this._currentGlobalUniformData = globalUniformData;
    }
    push(options) {
        this.bind(options);
        this._globalUniformDataStack[this._stackIndex++] = this._currentGlobalUniformData;
    }
    pop() {
        this._currentGlobalUniformData = this._globalUniformDataStack[--this._stackIndex - 1];
        if (this._renderer.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RendererType"].WEBGL) {
            this._currentGlobalUniformData.bindGroup.resources[0].update();
        }
    }
    get bindGroup() {
        return this._currentGlobalUniformData.bindGroup;
    }
    get globalUniformData() {
        return this._currentGlobalUniformData;
    }
    get uniformGroup() {
        return this._currentGlobalUniformData.bindGroup.resources[0];
    }
    _createUniforms() {
        const globalUniforms = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UniformGroup"]({
            uProjectionMatrix: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"](),
                type: "mat3x3<f32>"
            },
            uWorldTransformMatrix: {
                value: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"](),
                type: "mat3x3<f32>"
            },
            // TODO - someone smart - set this to be a unorm8x4 rather than a vec4<f32>
            uWorldColorAlpha: {
                value: new Float32Array(4),
                type: "vec4<f32>"
            },
            uResolution: {
                value: [
                    0,
                    0
                ],
                type: "vec2<f32>"
            }
        }, {
            isStatic: true
        });
        return globalUniforms;
    }
    destroy() {
        this._renderer = null;
        this._globalUniformDataStack.length = 0;
        this._uniformsPool.length = 0;
        this._activeUniforms.length = 0;
        this._bindGroupPool.length = 0;
        this._activeBindGroups.length = 0;
        this._currentGlobalUniformData = null;
    }
}
/** @ignore */ GlobalUniformSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasSystem
    ],
    name: "globalUniforms"
};
;
 //# sourceMappingURL=GlobalUniformSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/SchedulerSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SchedulerSystem",
    ()=>SchedulerSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$Ticker$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/ticker/Ticker.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
let uid = 1;
class SchedulerSystem {
    constructor(){
        this._tasks = [];
        /** a small off set to apply to the repeat schedules. This is just to make sure they run at slightly different times */ this._offset = 0;
    }
    /** Initializes the scheduler system and starts the ticker. */ init() {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$Ticker$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Ticker"].system.add(this._update, this);
    }
    /**
   * Schedules a repeating task.
   * @param func - The function to execute.
   * @param duration - The interval duration in milliseconds.
   * @param useOffset - this will spread out tasks so that they do not all run at the same time
   * @returns The unique identifier for the scheduled task.
   */ repeat(func, duration, useOffset = true) {
        const id = uid++;
        let offset = 0;
        if (useOffset) {
            this._offset += 1e3;
            offset = this._offset;
        }
        this._tasks.push({
            func,
            duration,
            start: performance.now(),
            offset,
            last: performance.now(),
            repeat: true,
            id
        });
        return id;
    }
    /**
   * Cancels a scheduled task.
   * @param id - The unique identifier of the task to cancel.
   */ cancel(id) {
        for(let i = 0; i < this._tasks.length; i++){
            if (this._tasks[i].id === id) {
                this._tasks.splice(i, 1);
                return;
            }
        }
    }
    /**
   * Updates and executes the scheduled tasks.
   * @private
   */ _update() {
        const now = performance.now();
        for(let i = 0; i < this._tasks.length; i++){
            const task = this._tasks[i];
            if (now - task.offset - task.last >= task.duration) {
                const elapsed = now - task.start;
                task.func(elapsed);
                task.last = now;
            }
        }
    }
    /**
   * Destroys the scheduler system and removes all tasks.
   * @internal
   */ destroy() {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$ticker$2f$Ticker$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Ticker"].system.remove(this._update, this);
        this._tasks.length = 0;
    }
}
/** @ignore */ SchedulerSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasSystem
    ],
    name: "scheduler",
    priority: 0
};
;
 //# sourceMappingURL=SchedulerSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/sayHello.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sayHello",
    ()=>sayHello
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/const.mjs [app-ssr] (ecmascript) <locals>");
;
;
"use strict";
let saidHello = false;
function sayHello(type) {
    if (saidHello) {
        return;
    }
    if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().getNavigator().userAgent.toLowerCase().indexOf("chrome") > -1) {
        const args = [
            `%c  %c  %c  %c  %c PixiJS %c v${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["VERSION"]} (${type}) http://www.pixijs.com/

`,
            "background: #E72264; padding:5px 0;",
            "background: #6CA2EA; padding:5px 0;",
            "background: #B5D33D; padding:5px 0;",
            "background: #FED23F; padding:5px 0;",
            "color: #FFFFFF; background: #E72264; padding:5px 0;",
            "color: #E72264; background: #FFFFFF; padding:5px 0;"
        ];
        globalThis.console.log(...args);
    } else if (globalThis.console) {
        globalThis.console.log(`PixiJS ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["VERSION"]} - ${type} - http://www.pixijs.com/`);
    }
    saidHello = true;
}
;
 //# sourceMappingURL=sayHello.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/startup/HelloSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HelloSystem",
    ()=>HelloSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$sayHello$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/sayHello.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/types.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
class HelloSystem {
    constructor(renderer){
        this._renderer = renderer;
    }
    /**
   * It all starts here! This initiates every system, passing in the options for any system by name.
   * @param options - the config for the renderer and all its systems
   */ init(options) {
        if (options.hello) {
            let name = this._renderer.name;
            if (this._renderer.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RendererType"].WEBGL) {
                name += ` ${this._renderer.context.webGLVersion}`;
            }
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$sayHello$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sayHello"])(name);
        }
    }
}
/** @ignore */ HelloSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasSystem
    ],
    name: "hello",
    priority: -2
};
/** The default options for the system. */ HelloSystem.defaultOptions = {
    /** {@link WebGLOptions.hello} */ hello: false
};
;
 //# sourceMappingURL=HelloSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/clean.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cleanArray",
    ()=>cleanArray,
    "cleanHash",
    ()=>cleanHash
]);
"use strict";
function cleanHash(hash) {
    let clean = false;
    for(const i in hash){
        if (hash[i] == void 0) {
            clean = true;
            break;
        }
    }
    if (!clean) return hash;
    const cleanHash2 = /* @__PURE__ */ Object.create(null);
    for(const i in hash){
        const value = hash[i];
        if (value) {
            cleanHash2[i] = value;
        }
    }
    return cleanHash2;
}
function cleanArray(arr) {
    let offset = 0;
    for(let i = 0; i < arr.length; i++){
        if (arr[i] == void 0) {
            offset++;
        } else {
            arr[i - offset] = arr[i];
        }
    }
    arr.length -= offset;
    return arr;
}
;
 //# sourceMappingURL=clean.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/RenderableGCSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RenderableGCSystem",
    ()=>RenderableGCSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$clean$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/clean.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
let renderableGCTick = 0;
const _RenderableGCSystem = class _RenderableGCSystem {
    /**
   * Creates a new RenderableGCSystem instance.
   * @param renderer - The renderer this garbage collection system works for
   */ constructor(renderer){
        /** Array of renderables being tracked for garbage collection */ this._managedRenderables = [];
        /** Array of hash objects being tracked for cleanup */ this._managedHashes = [];
        /** Array of arrays being tracked for cleanup */ this._managedArrays = [];
        this._renderer = renderer;
    }
    /**
   * Initializes the garbage collection system with the provided options.
   * @param options - Configuration options for the renderer
   */ init(options) {
        options = {
            ..._RenderableGCSystem.defaultOptions,
            ...options
        };
        this.maxUnusedTime = options.renderableGCMaxUnusedTime;
        this._frequency = options.renderableGCFrequency;
        this.enabled = options.renderableGCActive;
    }
    /**
   * Gets whether the garbage collection system is currently enabled.
   * @returns True if GC is enabled, false otherwise
   */ get enabled() {
        return !!this._handler;
    }
    /**
   * Enables or disables the garbage collection system.
   * When enabled, schedules periodic cleanup of resources.
   * When disabled, cancels all scheduled cleanups.
   */ set enabled(value) {
        if (this.enabled === value) return;
        if (value) {
            this._handler = this._renderer.scheduler.repeat(()=>this.run(), this._frequency, false);
            this._hashHandler = this._renderer.scheduler.repeat(()=>{
                for (const hash of this._managedHashes){
                    hash.context[hash.hash] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$clean$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cleanHash"])(hash.context[hash.hash]);
                }
            }, this._frequency);
            this._arrayHandler = this._renderer.scheduler.repeat(()=>{
                for (const array of this._managedArrays){
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$clean$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cleanArray"])(array.context[array.hash]);
                }
            }, this._frequency);
        } else {
            this._renderer.scheduler.cancel(this._handler);
            this._renderer.scheduler.cancel(this._hashHandler);
            this._renderer.scheduler.cancel(this._arrayHandler);
        }
    }
    /**
   * Adds a hash table to be managed by the garbage collector.
   * @param context - The object containing the hash table
   * @param hash - The property name of the hash table
   */ addManagedHash(context, hash) {
        this._managedHashes.push({
            context,
            hash
        });
    }
    /**
   * Adds an array to be managed by the garbage collector.
   * @param context - The object containing the array
   * @param hash - The property name of the array
   */ addManagedArray(context, hash) {
        this._managedArrays.push({
            context,
            hash
        });
    }
    /**
   * Updates the GC timestamp and tracking before rendering.
   * @param options - The render options
   * @param options.container - The container to render
   */ prerender({ container }) {
        this._now = performance.now();
        container.renderGroup.gcTick = renderableGCTick++;
        this._updateInstructionGCTick(container.renderGroup, container.renderGroup.gcTick);
    }
    /**
   * Starts tracking a renderable for garbage collection.
   * @param renderable - The renderable to track
   */ addRenderable(renderable) {
        if (!this.enabled) return;
        if (renderable._lastUsed === -1) {
            this._managedRenderables.push(renderable);
            renderable.once("destroyed", this._removeRenderable, this);
        }
        renderable._lastUsed = this._now;
    }
    /**
   * Performs garbage collection by cleaning up unused renderables.
   * Removes renderables that haven't been used for longer than maxUnusedTime.
   */ run() {
        const now = this._now;
        const managedRenderables = this._managedRenderables;
        const renderPipes = this._renderer.renderPipes;
        let offset = 0;
        for(let i = 0; i < managedRenderables.length; i++){
            const renderable = managedRenderables[i];
            if (renderable === null) {
                offset++;
                continue;
            }
            const renderGroup = renderable.renderGroup ?? renderable.parentRenderGroup;
            const currentTick = renderGroup?.instructionSet?.gcTick ?? -1;
            if ((renderGroup?.gcTick ?? 0) === currentTick) {
                renderable._lastUsed = now;
            }
            if (now - renderable._lastUsed > this.maxUnusedTime) {
                if (!renderable.destroyed) {
                    const rp = renderPipes;
                    if (renderGroup) renderGroup.structureDidChange = true;
                    rp[renderable.renderPipeId].destroyRenderable(renderable);
                }
                renderable._lastUsed = -1;
                offset++;
                renderable.off("destroyed", this._removeRenderable, this);
            } else {
                managedRenderables[i - offset] = renderable;
            }
        }
        managedRenderables.length -= offset;
    }
    /** Cleans up the garbage collection system. Disables GC and removes all tracked resources. */ destroy() {
        this.enabled = false;
        this._renderer = null;
        this._managedRenderables.length = 0;
        this._managedHashes.length = 0;
        this._managedArrays.length = 0;
    }
    /**
   * Removes a renderable from being tracked when it's destroyed.
   * @param renderable - The renderable to stop tracking
   */ _removeRenderable(renderable) {
        const index = this._managedRenderables.indexOf(renderable);
        if (index >= 0) {
            renderable.off("destroyed", this._removeRenderable, this);
            this._managedRenderables[index] = null;
        }
    }
    /**
   * Updates the GC tick counter for a render group and its children.
   * @param renderGroup - The render group to update
   * @param gcTick - The new tick value
   */ _updateInstructionGCTick(renderGroup, gcTick) {
        renderGroup.instructionSet.gcTick = gcTick;
        for (const child of renderGroup.renderGroupChildren){
            this._updateInstructionGCTick(child, gcTick);
        }
    }
};
/**
 * Extension metadata for registering this system with the renderer.
 * @ignore
 */ _RenderableGCSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "renderableGC",
    priority: 0
};
/**
 * Default configuration options for the garbage collection system.
 * These can be overridden when initializing the renderer.
 */ _RenderableGCSystem.defaultOptions = {
    /** Enable/disable the garbage collector */ renderableGCActive: true,
    /** Time in ms before an unused resource is collected (default 1 minute) */ renderableGCMaxUnusedTime: 6e4,
    /** How often to run garbage collection in ms (default 30 seconds) */ renderableGCFrequency: 3e4
};
let RenderableGCSystem = _RenderableGCSystem;
;
 //# sourceMappingURL=RenderableGCSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TextureGCSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TextureGCSystem",
    ()=>TextureGCSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
;
"use strict";
const _TextureGCSystem = class _TextureGCSystem {
    /** @param renderer - The renderer this System works for. */ constructor(renderer){
        this._renderer = renderer;
        this.count = 0;
        this.checkCount = 0;
    }
    init(options) {
        options = {
            ..._TextureGCSystem.defaultOptions,
            ...options
        };
        this.checkCountMax = options.textureGCCheckCountMax;
        this.maxIdle = options.textureGCAMaxIdle ?? options.textureGCMaxIdle;
        this.active = options.textureGCActive;
    }
    /**
   * Checks to see when the last time a texture was used.
   * If the texture has not been used for a specified amount of time, it will be removed from the GPU.
   */ postrender() {
        if (!this._renderer.renderingToScreen) {
            return;
        }
        this.count++;
        if (!this.active) return;
        this.checkCount++;
        if (this.checkCount > this.checkCountMax) {
            this.checkCount = 0;
            this.run();
        }
    }
    /**
   * Checks to see when the last time a texture was used.
   * If the texture has not been used for a specified amount of time, it will be removed from the GPU.
   */ run() {
        const managedTextures = this._renderer.texture.managedTextures;
        for(let i = 0; i < managedTextures.length; i++){
            const texture = managedTextures[i];
            if (texture.autoGarbageCollect && texture.resource && texture._touched > -1 && this.count - texture._touched > this.maxIdle) {
                texture._touched = -1;
                texture.unload();
            }
        }
    }
    destroy() {
        this._renderer = null;
    }
};
/** @ignore */ _TextureGCSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem
    ],
    name: "textureGC"
};
/** default options for the TextureGCSystem */ _TextureGCSystem.defaultOptions = {
    /**
   * If set to true, this will enable the garbage collector on the GPU.
   * @default true
   */ textureGCActive: true,
    /**
   * @deprecated since 8.3.0
   * @see {@link TextureGCSystemOptions.textureGCMaxIdle}
   */ textureGCAMaxIdle: null,
    /**
   * The maximum idle frames before a texture is destroyed by garbage collection.
   * @default 60 * 60
   */ textureGCMaxIdle: 60 * 60,
    /**
   * Frames between two garbage collections.
   * @default 600
   */ textureGCCheckCountMax: 600
};
let TextureGCSystem = _TextureGCSystem;
;
 //# sourceMappingURL=TextureGCSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/renderTarget/RenderTarget.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RenderTarget",
    ()=>RenderTarget
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/TextureSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
const _RenderTarget = class _RenderTarget {
    /**
   * @param [descriptor] - Options for creating a render target.
   */ constructor(descriptor = {}){
        /** unique id for this render target */ this.uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uid"])("renderTarget");
        /**
     * An array of textures that can be written to by the GPU - mostly this has one texture in Pixi, but you could
     * write to multiple if required! (eg deferred lighting)
     */ this.colorTextures = [];
        this.dirtyId = 0;
        this.isRoot = false;
        this._size = new Float32Array(2);
        /** if true, then when the render target is destroyed, it will destroy all the textures that were created for it. */ this._managedColorTextures = false;
        descriptor = {
            ..._RenderTarget.defaultOptions,
            ...descriptor
        };
        this.stencil = descriptor.stencil;
        this.depth = descriptor.depth;
        this.isRoot = descriptor.isRoot;
        if (typeof descriptor.colorTextures === "number") {
            this._managedColorTextures = true;
            for(let i = 0; i < descriptor.colorTextures; i++){
                this.colorTextures.push(new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureSource"]({
                    width: descriptor.width,
                    height: descriptor.height,
                    resolution: descriptor.resolution,
                    antialias: descriptor.antialias
                }));
            }
        } else {
            this.colorTextures = [
                ...descriptor.colorTextures.map((texture)=>texture.source)
            ];
            const colorSource = this.colorTexture.source;
            this.resize(colorSource.width, colorSource.height, colorSource._resolution);
        }
        this.colorTexture.source.on("resize", this.onSourceResize, this);
        if (descriptor.depthStencilTexture || this.stencil) {
            if (descriptor.depthStencilTexture instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"] || descriptor.depthStencilTexture instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureSource"]) {
                this.depthStencilTexture = descriptor.depthStencilTexture.source;
            } else {
                this.ensureDepthStencilTexture();
            }
        }
    }
    get size() {
        const _size = this._size;
        _size[0] = this.pixelWidth;
        _size[1] = this.pixelHeight;
        return _size;
    }
    get width() {
        return this.colorTexture.source.width;
    }
    get height() {
        return this.colorTexture.source.height;
    }
    get pixelWidth() {
        return this.colorTexture.source.pixelWidth;
    }
    get pixelHeight() {
        return this.colorTexture.source.pixelHeight;
    }
    get resolution() {
        return this.colorTexture.source._resolution;
    }
    get colorTexture() {
        return this.colorTextures[0];
    }
    onSourceResize(source) {
        this.resize(source.width, source.height, source._resolution, true);
    }
    /**
   * This will ensure a depthStencil texture is created for this render target.
   * Most likely called by the mask system to make sure we have stencil buffer added.
   * @internal
   */ ensureDepthStencilTexture() {
        if (!this.depthStencilTexture) {
            this.depthStencilTexture = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureSource"]({
                width: this.width,
                height: this.height,
                resolution: this.resolution,
                format: "depth24plus-stencil8",
                autoGenerateMipmaps: false,
                antialias: false,
                mipLevelCount: 1
            });
        }
    }
    resize(width, height, resolution = this.resolution, skipColorTexture = false) {
        this.dirtyId++;
        this.colorTextures.forEach((colorTexture, i)=>{
            if (skipColorTexture && i === 0) return;
            colorTexture.source.resize(width, height, resolution);
        });
        if (this.depthStencilTexture) {
            this.depthStencilTexture.source.resize(width, height, resolution);
        }
    }
    destroy() {
        this.colorTexture.source.off("resize", this.onSourceResize, this);
        if (this._managedColorTextures) {
            this.colorTextures.forEach((texture)=>{
                texture.destroy();
            });
        }
        if (this.depthStencilTexture) {
            this.depthStencilTexture.destroy();
            delete this.depthStencilTexture;
        }
    }
};
/** The default options for a render target */ _RenderTarget.defaultOptions = {
    /** the width of the RenderTarget */ width: 0,
    /** the height of the RenderTarget */ height: 0,
    /** the resolution of the RenderTarget */ resolution: 1,
    /** an array of textures, or a number indicating how many color textures there should be */ colorTextures: 1,
    /** should this render target have a stencil buffer? */ stencil: false,
    /** should this render target have a depth buffer? */ depth: false,
    /** should this render target be antialiased? */ antialias: false,
    // save on perf by default!
    /** is this a root element, true if this is gl context owners render target */ isRoot: false
};
let RenderTarget = _RenderTarget;
;
 //# sourceMappingURL=RenderTarget.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/utils/getCanvasTexture.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getCanvasTexture",
    ()=>getCanvasTexture,
    "hasCachedCanvasTexture",
    ()=>hasCachedCanvasTexture
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$GlobalResourceRegistry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/pool/GlobalResourceRegistry.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$CanvasSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/CanvasSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
const canvasCache = /* @__PURE__ */ new Map();
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$pool$2f$GlobalResourceRegistry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlobalResourceRegistry"].register(canvasCache);
function getCanvasTexture(canvas, options) {
    if (!canvasCache.has(canvas)) {
        const texture = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"]({
            source: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$CanvasSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasSource"]({
                resource: canvas,
                ...options
            })
        });
        const onDestroy = ()=>{
            if (canvasCache.get(canvas) === texture) {
                canvasCache.delete(canvas);
            }
        };
        texture.once("destroy", onDestroy);
        texture.source.once("destroy", onDestroy);
        canvasCache.set(canvas, texture);
    }
    return canvasCache.get(canvas);
}
function hasCachedCanvasTexture(canvas) {
    return canvasCache.has(canvas);
}
;
 //# sourceMappingURL=getCanvasTexture.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/view/ViewSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ViewSystem",
    ()=>ViewSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/deprecation.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$RenderTarget$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/renderTarget/RenderTarget.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$utils$2f$getCanvasTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/utils/getCanvasTexture.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
"use strict";
const _ViewSystem = class _ViewSystem {
    /**
   * Whether CSS dimensions of canvas view should be resized to screen dimensions automatically.
   * This is only supported for HTMLCanvasElement and will be ignored if the canvas is an OffscreenCanvas.
   * @type {boolean}
   */ get autoDensity() {
        return this.texture.source.autoDensity;
    }
    set autoDensity(value) {
        this.texture.source.autoDensity = value;
    }
    /** The resolution / device pixel ratio of the renderer. */ get resolution() {
        return this.texture.source._resolution;
    }
    set resolution(value) {
        this.texture.source.resize(this.texture.source.width, this.texture.source.height, value);
    }
    /**
   * initiates the view system
   * @param options - the options for the view
   */ init(options) {
        options = {
            ..._ViewSystem.defaultOptions,
            ...options
        };
        if (options.view) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["deprecation"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$deprecation$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["v8_0_0"], "ViewSystem.view has been renamed to ViewSystem.canvas");
            options.canvas = options.view;
        }
        this.screen = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Rectangle"](0, 0, options.width, options.height);
        this.canvas = options.canvas || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createCanvas();
        this.antialias = !!options.antialias;
        this.texture = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$utils$2f$getCanvasTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCanvasTexture"])(this.canvas, options);
        this.renderTarget = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$RenderTarget$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderTarget"]({
            colorTextures: [
                this.texture
            ],
            depth: !!options.depth,
            isRoot: true
        });
        this.texture.source.transparent = options.backgroundAlpha < 1;
        this.resolution = options.resolution;
    }
    /**
   * Resizes the screen and canvas to the specified dimensions.
   * @param desiredScreenWidth - The new width of the screen.
   * @param desiredScreenHeight - The new height of the screen.
   * @param resolution
   */ resize(desiredScreenWidth, desiredScreenHeight, resolution) {
        this.texture.source.resize(desiredScreenWidth, desiredScreenHeight, resolution);
        this.screen.width = this.texture.frame.width;
        this.screen.height = this.texture.frame.height;
    }
    /**
   * Destroys this System and optionally removes the canvas from the dom.
   * @param {options | false} options - The options for destroying the view, or "false".
   * @example
   * viewSystem.destroy();
   * viewSystem.destroy(true);
   * viewSystem.destroy({ removeView: true });
   */ destroy(options = false) {
        const removeView = typeof options === "boolean" ? options : !!options?.removeView;
        if (removeView && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
        this.texture.destroy();
    }
};
/** @ignore */ _ViewSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGPUSystem,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].CanvasSystem
    ],
    name: "view",
    priority: 0
};
/** The default options for the view system. */ _ViewSystem.defaultOptions = {
    /**
   * {@link WebGLOptions.width}
   * @default 800
   */ width: 800,
    /**
   * {@link WebGLOptions.height}
   * @default 600
   */ height: 600,
    /**
   * {@link WebGLOptions.autoDensity}
   * @default false
   */ autoDensity: false,
    /**
   * {@link WebGLOptions.antialias}
   * @default false
   */ antialias: false
};
let ViewSystem = _ViewSystem;
;
 //# sourceMappingURL=ViewSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/system/SharedSystems.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SharedRenderPipes",
    ()=>SharedRenderPipes,
    "SharedSystems",
    ()=>SharedSystems
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$CustomRenderPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/CustomRenderPipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$RenderGroupPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/RenderGroupPipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$RenderGroupSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/container/RenderGroupSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$SpritePipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/sprite/SpritePipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$global$2f$globalHooks$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/global/globalHooks.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$BatcherPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/shared/BatcherPipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$alpha$2f$AlphaMaskPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/alpha/AlphaMaskPipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$color$2f$ColorMaskPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/color/ColorMaskPipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$stencil$2f$StencilMaskPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/mask/stencil/StencilMaskPipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$background$2f$BackgroundSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/background/BackgroundSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$blendModes$2f$BlendModePipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/blendModes/BlendModePipe.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$extract$2f$ExtractSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/extract/ExtractSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$extract$2f$GenerateTextureSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/extract/GenerateTextureSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$GlobalUniformSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/renderTarget/GlobalUniformSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$SchedulerSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/SchedulerSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$startup$2f$HelloSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/startup/HelloSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$RenderableGCSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/RenderableGCSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureGCSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/TextureGCSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$view$2f$ViewSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/view/ViewSystem.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
"use strict";
const SharedSystems = [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$background$2f$BackgroundSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BackgroundSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$GlobalUniformSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlobalUniformSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$startup$2f$HelloSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["HelloSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$view$2f$ViewSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ViewSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$RenderGroupSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderGroupSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$TextureGCSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureGCSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$extract$2f$GenerateTextureSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GenerateTextureSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$extract$2f$ExtractSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtractSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$global$2f$globalHooks$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RendererInitHook"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$RenderableGCSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderableGCSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$SchedulerSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SchedulerSystem"]
];
const SharedRenderPipes = [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$blendModes$2f$BlendModePipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BlendModePipe"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$shared$2f$BatcherPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BatcherPipe"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$sprite$2f$SpritePipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SpritePipe"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$RenderGroupPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderGroupPipe"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$alpha$2f$AlphaMaskPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AlphaMaskPipe"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$stencil$2f$StencilMaskPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["StencilMaskPipe"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$mask$2f$color$2f$ColorMaskPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ColorMaskPipe"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$container$2f$CustomRenderPipe$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CustomRenderPipe"]
];
;
 //# sourceMappingURL=SharedSystems.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/buffer/const.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BUFFER_TYPE",
    ()=>BUFFER_TYPE
]);
"use strict";
var BUFFER_TYPE = /* @__PURE__ */ ((BUFFER_TYPE2)=>{
    BUFFER_TYPE2[BUFFER_TYPE2["ELEMENT_ARRAY_BUFFER"] = 34963] = "ELEMENT_ARRAY_BUFFER";
    BUFFER_TYPE2[BUFFER_TYPE2["ARRAY_BUFFER"] = 34962] = "ARRAY_BUFFER";
    BUFFER_TYPE2[BUFFER_TYPE2["UNIFORM_BUFFER"] = 35345] = "UNIFORM_BUFFER";
    return BUFFER_TYPE2;
})(BUFFER_TYPE || {});
;
 //# sourceMappingURL=const.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/buffer/GlBuffer.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlBuffer",
    ()=>GlBuffer
]);
"use strict";
class GlBuffer {
    constructor(buffer, type){
        this._lastBindBaseLocation = -1;
        this._lastBindCallId = -1;
        this.buffer = buffer || null;
        this.updateID = -1;
        this.byteLength = -1;
        this.type = type;
    }
}
;
 //# sourceMappingURL=GlBuffer.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/buffer/GlBufferSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlBufferSystem",
    ()=>GlBufferSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/const.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/buffer/const.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$buffer$2f$GlBuffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/buffer/GlBuffer.mjs [app-ssr] (ecmascript)");
;
;
;
;
"use strict";
class GlBufferSystem {
    /**
   * @param {Renderer} renderer - The renderer this System works for.
   */ constructor(renderer){
        this._gpuBuffers = /* @__PURE__ */ Object.create(null);
        /** Cache keeping track of the base bound buffer bases */ this._boundBufferBases = /* @__PURE__ */ Object.create(null);
        this._minBaseLocation = 0;
        this._nextBindBaseIndex = this._minBaseLocation;
        this._bindCallId = 0;
        this._renderer = renderer;
        this._renderer.renderableGC.addManagedHash(this, "_gpuBuffers");
    }
    /** @ignore */ destroy() {
        this._renderer = null;
        this._gl = null;
        this._gpuBuffers = null;
        this._boundBufferBases = null;
    }
    /** Sets up the renderer context and necessary buffers. */ contextChange() {
        this._gl = this._renderer.gl;
        this._gpuBuffers = /* @__PURE__ */ Object.create(null);
        this._maxBindings = this._renderer.limits.maxUniformBindings;
    }
    getGlBuffer(buffer) {
        return this._gpuBuffers[buffer.uid] || this.createGLBuffer(buffer);
    }
    /**
   * This binds specified buffer. On first run, it will create the webGL buffers for the context too
   * @param buffer - the buffer to bind to the renderer
   */ bind(buffer) {
        const { _gl: gl } = this;
        const glBuffer = this.getGlBuffer(buffer);
        gl.bindBuffer(glBuffer.type, glBuffer.buffer);
    }
    /**
   * Binds an uniform buffer to at the given index.
   *
   * A cache is used so a buffer will not be bound again if already bound.
   * @param glBuffer - the buffer to bind
   * @param index - the base index to bind it to.
   */ bindBufferBase(glBuffer, index) {
        const { _gl: gl } = this;
        if (this._boundBufferBases[index] !== glBuffer) {
            this._boundBufferBases[index] = glBuffer;
            glBuffer._lastBindBaseLocation = index;
            gl.bindBufferBase(gl.UNIFORM_BUFFER, index, glBuffer.buffer);
        }
    }
    nextBindBase(hasTransformFeedback) {
        this._bindCallId++;
        this._minBaseLocation = 0;
        if (hasTransformFeedback) {
            this._boundBufferBases[0] = null;
            this._minBaseLocation = 1;
            if (this._nextBindBaseIndex < 1) {
                this._nextBindBaseIndex = 1;
            }
        }
    }
    freeLocationForBufferBase(glBuffer) {
        let freeIndex = this.getLastBindBaseLocation(glBuffer);
        if (freeIndex >= this._minBaseLocation) {
            glBuffer._lastBindCallId = this._bindCallId;
            return freeIndex;
        }
        let loop = 0;
        let nextIndex = this._nextBindBaseIndex;
        while(loop < 2){
            if (nextIndex >= this._maxBindings) {
                nextIndex = this._minBaseLocation;
                loop++;
            }
            const curBuf = this._boundBufferBases[nextIndex];
            if (curBuf && curBuf._lastBindCallId === this._bindCallId) {
                nextIndex++;
                continue;
            }
            break;
        }
        freeIndex = nextIndex;
        this._nextBindBaseIndex = nextIndex + 1;
        if (loop >= 2) {
            return -1;
        }
        glBuffer._lastBindCallId = this._bindCallId;
        this._boundBufferBases[freeIndex] = null;
        return freeIndex;
    }
    getLastBindBaseLocation(glBuffer) {
        const index = glBuffer._lastBindBaseLocation;
        if (this._boundBufferBases[index] === glBuffer) {
            return index;
        }
        return -1;
    }
    /**
   * Binds a buffer whilst also binding its range.
   * This will make the buffer start from the offset supplied rather than 0 when it is read.
   * @param glBuffer - the buffer to bind
   * @param index - the base index to bind at, defaults to 0
   * @param offset - the offset to bind at (this is blocks of 256). 0 = 0, 1 = 256, 2 = 512 etc
   * @param size - the size to bind at (this is blocks of 256).
   */ bindBufferRange(glBuffer, index, offset, size) {
        const { _gl: gl } = this;
        offset || (offset = 0);
        index || (index = 0);
        this._boundBufferBases[index] = null;
        gl.bindBufferRange(gl.UNIFORM_BUFFER, index || 0, glBuffer.buffer, offset * 256, size || 256);
    }
    /**
   * Will ensure the data in the buffer is uploaded to the GPU.
   * @param {Buffer} buffer - the buffer to update
   */ updateBuffer(buffer) {
        const { _gl: gl } = this;
        const glBuffer = this.getGlBuffer(buffer);
        if (buffer._updateID === glBuffer.updateID) {
            return glBuffer;
        }
        glBuffer.updateID = buffer._updateID;
        gl.bindBuffer(glBuffer.type, glBuffer.buffer);
        const data = buffer.data;
        const drawType = buffer.descriptor.usage & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].STATIC ? gl.STATIC_DRAW : gl.DYNAMIC_DRAW;
        if (data) {
            if (glBuffer.byteLength >= data.byteLength) {
                gl.bufferSubData(glBuffer.type, 0, data, 0, buffer._updateSize / data.BYTES_PER_ELEMENT);
            } else {
                glBuffer.byteLength = data.byteLength;
                gl.bufferData(glBuffer.type, data, drawType);
            }
        } else {
            glBuffer.byteLength = buffer.descriptor.size;
            gl.bufferData(glBuffer.type, glBuffer.byteLength, drawType);
        }
        return glBuffer;
    }
    /** dispose all WebGL resources of all managed buffers */ destroyAll() {
        const gl = this._gl;
        for(const id in this._gpuBuffers){
            gl.deleteBuffer(this._gpuBuffers[id].buffer);
        }
        this._gpuBuffers = /* @__PURE__ */ Object.create(null);
    }
    /**
   * Disposes buffer
   * @param {Buffer} buffer - buffer with data
   * @param {boolean} [contextLost=false] - If context was lost, we suppress deleteVertexArray
   */ onBufferDestroy(buffer, contextLost) {
        const glBuffer = this._gpuBuffers[buffer.uid];
        const gl = this._gl;
        if (!contextLost) {
            gl.deleteBuffer(glBuffer.buffer);
        }
        this._gpuBuffers[buffer.uid] = null;
    }
    /**
   * creates and attaches a GLBuffer object tied to the current context.
   * @param buffer
   * @protected
   */ createGLBuffer(buffer) {
        const { _gl: gl } = this;
        let type = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BUFFER_TYPE"].ARRAY_BUFFER;
        if (buffer.descriptor.usage & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].INDEX) {
            type = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BUFFER_TYPE"].ELEMENT_ARRAY_BUFFER;
        } else if (buffer.descriptor.usage & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].UNIFORM) {
            type = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BUFFER_TYPE"].UNIFORM_BUFFER;
        }
        const glBuffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$buffer$2f$GlBuffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlBuffer"](gl.createBuffer(), type);
        this._gpuBuffers[buffer.uid] = glBuffer;
        buffer.on("destroy", this.onBufferDestroy, this);
        return glBuffer;
    }
    resetState() {
        this._boundBufferBases = /* @__PURE__ */ Object.create(null);
    }
}
/** @ignore */ GlBufferSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem
    ],
    name: "buffer"
};
;
 //# sourceMappingURL=GlBufferSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/context/GlContextSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlContextSystem",
    ()=>GlContextSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
const _GlContextSystem = class _GlContextSystem {
    /** @param renderer - The renderer this System works for. */ constructor(renderer){
        /**
     * Features supported by current renderer.
     * @type {object}
     * @readonly
     */ this.supports = {
            /** Support for 32-bit indices buffer. */ uint32Indices: true,
            /** Support for UniformBufferObjects */ uniformBufferObject: true,
            /** Support for VertexArrayObjects */ vertexArrayObject: true,
            /** Support for SRGB texture format */ srgbTextures: true,
            /** Support for wrapping modes if a texture is non-power of two */ nonPowOf2wrapping: true,
            /** Support for MSAA (antialiasing of dynamic textures) */ msaa: true,
            /** Support for mipmaps if a texture is non-power of two */ nonPowOf2mipmaps: true
        };
        this._renderer = renderer;
        this.extensions = /* @__PURE__ */ Object.create(null);
        this.handleContextLost = this.handleContextLost.bind(this);
        this.handleContextRestored = this.handleContextRestored.bind(this);
    }
    /**
   * `true` if the context is lost
   * @readonly
   */ get isLost() {
        return !this.gl || this.gl.isContextLost();
    }
    /**
   * Handles the context change event.
   * @param {WebGLRenderingContext} gl - New WebGL context.
   */ contextChange(gl) {
        this.gl = gl;
        this._renderer.gl = gl;
    }
    init(options) {
        options = {
            ..._GlContextSystem.defaultOptions,
            ...options
        };
        let multiView = this.multiView = options.multiView;
        if (options.context && multiView) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("Renderer created with both a context and multiview enabled. Disabling multiView as both cannot work together.");
            multiView = false;
        }
        if (multiView) {
            this.canvas = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createCanvas(this._renderer.canvas.width, this._renderer.canvas.height);
        } else {
            this.canvas = this._renderer.view.canvas;
        }
        if (options.context) {
            this.initFromContext(options.context);
        } else {
            const alpha = this._renderer.background.alpha < 1;
            const premultipliedAlpha = options.premultipliedAlpha ?? true;
            const antialias = options.antialias && !this._renderer.backBuffer.useBackBuffer;
            this.createContext(options.preferWebGLVersion, {
                alpha,
                premultipliedAlpha,
                antialias,
                stencil: true,
                preserveDrawingBuffer: options.preserveDrawingBuffer,
                powerPreference: options.powerPreference ?? "default"
            });
        }
    }
    ensureCanvasSize(targetCanvas) {
        if (!this.multiView) {
            if (targetCanvas !== this.canvas) {
                (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("multiView is disabled, but targetCanvas is not the main canvas");
            }
            return;
        }
        const { canvas } = this;
        if (canvas.width < targetCanvas.width || canvas.height < targetCanvas.height) {
            canvas.width = Math.max(targetCanvas.width, targetCanvas.width);
            canvas.height = Math.max(targetCanvas.height, targetCanvas.height);
        }
    }
    /**
   * Initializes the context.
   * @protected
   * @param {WebGLRenderingContext} gl - WebGL context
   */ initFromContext(gl) {
        this.gl = gl;
        this.webGLVersion = gl instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().getWebGLRenderingContext() ? 1 : 2;
        this.getExtensions();
        this.validateContext(gl);
        this._renderer.runners.contextChange.emit(gl);
        const element = this._renderer.view.canvas;
        element.addEventListener("webglcontextlost", this.handleContextLost, false);
        element.addEventListener("webglcontextrestored", this.handleContextRestored, false);
    }
    /**
   * Initialize from context options
   * @protected
   * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext
   * @param preferWebGLVersion
   * @param {object} options - context attributes
   */ createContext(preferWebGLVersion, options) {
        let gl;
        const canvas = this.canvas;
        if (preferWebGLVersion === 2) {
            gl = canvas.getContext("webgl2", options);
        }
        if (!gl) {
            gl = canvas.getContext("webgl", options);
            if (!gl) {
                throw new Error("This browser does not support WebGL. Try using the canvas renderer");
            }
        }
        this.gl = gl;
        this.initFromContext(this.gl);
    }
    /** Auto-populate the {@link GlContextSystem.extensions extensions}. */ getExtensions() {
        const { gl } = this;
        const common = {
            anisotropicFiltering: gl.getExtension("EXT_texture_filter_anisotropic"),
            floatTextureLinear: gl.getExtension("OES_texture_float_linear"),
            s3tc: gl.getExtension("WEBGL_compressed_texture_s3tc"),
            s3tc_sRGB: gl.getExtension("WEBGL_compressed_texture_s3tc_srgb"),
            // eslint-disable-line camelcase
            etc: gl.getExtension("WEBGL_compressed_texture_etc"),
            etc1: gl.getExtension("WEBGL_compressed_texture_etc1"),
            pvrtc: gl.getExtension("WEBGL_compressed_texture_pvrtc") || gl.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc"),
            atc: gl.getExtension("WEBGL_compressed_texture_atc"),
            astc: gl.getExtension("WEBGL_compressed_texture_astc"),
            bptc: gl.getExtension("EXT_texture_compression_bptc"),
            rgtc: gl.getExtension("EXT_texture_compression_rgtc"),
            loseContext: gl.getExtension("WEBGL_lose_context")
        };
        if (this.webGLVersion === 1) {
            this.extensions = {
                ...common,
                drawBuffers: gl.getExtension("WEBGL_draw_buffers"),
                depthTexture: gl.getExtension("WEBGL_depth_texture"),
                vertexArrayObject: gl.getExtension("OES_vertex_array_object") || gl.getExtension("MOZ_OES_vertex_array_object") || gl.getExtension("WEBKIT_OES_vertex_array_object"),
                uint32ElementIndex: gl.getExtension("OES_element_index_uint"),
                // Floats and half-floats
                floatTexture: gl.getExtension("OES_texture_float"),
                floatTextureLinear: gl.getExtension("OES_texture_float_linear"),
                textureHalfFloat: gl.getExtension("OES_texture_half_float"),
                textureHalfFloatLinear: gl.getExtension("OES_texture_half_float_linear"),
                vertexAttribDivisorANGLE: gl.getExtension("ANGLE_instanced_arrays"),
                srgb: gl.getExtension("EXT_sRGB")
            };
        } else {
            this.extensions = {
                ...common,
                colorBufferFloat: gl.getExtension("EXT_color_buffer_float")
            };
            const provokeExt = gl.getExtension("WEBGL_provoking_vertex");
            if (provokeExt) {
                provokeExt.provokingVertexWEBGL(provokeExt.FIRST_VERTEX_CONVENTION_WEBGL);
            }
        }
    }
    /**
   * Handles a lost webgl context
   * @param {WebGLContextEvent} event - The context lost event.
   */ handleContextLost(event) {
        event.preventDefault();
        if (this._contextLossForced) {
            this._contextLossForced = false;
            setTimeout(()=>{
                if (this.gl.isContextLost()) {
                    this.extensions.loseContext?.restoreContext();
                }
            }, 0);
        }
    }
    /** Handles a restored webgl context. */ handleContextRestored() {
        this.getExtensions();
        this._renderer.runners.contextChange.emit(this.gl);
    }
    destroy() {
        const element = this._renderer.view.canvas;
        this._renderer = null;
        element.removeEventListener("webglcontextlost", this.handleContextLost);
        element.removeEventListener("webglcontextrestored", this.handleContextRestored);
        this.gl.useProgram(null);
        this.extensions.loseContext?.loseContext();
    }
    /**
   * this function can be called to force a webGL context loss
   * this will release all resources on the GPU.
   * Useful if you need to put Pixi to sleep, and save some GPU memory
   *
   * As soon as render is called - all resources will be created again.
   */ forceContextLoss() {
        this.extensions.loseContext?.loseContext();
        this._contextLossForced = true;
    }
    /**
   * Validate context.
   * @param {WebGLRenderingContext} gl - Render context.
   */ validateContext(gl) {
        const attributes = gl.getContextAttributes();
        if (attributes && !attributes.stencil) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("Provided WebGL context does not have a stencil buffer, masks may not render correctly");
        }
        const supports = this.supports;
        const isWebGl2 = this.webGLVersion === 2;
        const extensions = this.extensions;
        supports.uint32Indices = isWebGl2 || !!extensions.uint32ElementIndex;
        supports.uniformBufferObject = isWebGl2;
        supports.vertexArrayObject = isWebGl2 || !!extensions.vertexArrayObject;
        supports.srgbTextures = isWebGl2 || !!extensions.srgb;
        supports.nonPowOf2wrapping = isWebGl2;
        supports.nonPowOf2mipmaps = isWebGl2;
        supports.msaa = isWebGl2;
        if (!supports.uint32Indices) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("Provided WebGL context does not support 32 index buffer, large scenes may not render correctly");
        }
    }
};
/** @ignore */ _GlContextSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem
    ],
    name: "context"
};
/** The default options for the system. */ _GlContextSystem.defaultOptions = {
    /**
   * {@link WebGLOptions.context}
   * @default null
   */ context: null,
    /**
   * {@link WebGLOptions.premultipliedAlpha}
   * @default true
   */ premultipliedAlpha: true,
    /**
   * {@link WebGLOptions.preserveDrawingBuffer}
   * @default false
   */ preserveDrawingBuffer: false,
    /**
   * {@link WebGLOptions.powerPreference}
   * @default default
   */ powerPreference: void 0,
    /**
   * {@link WebGLOptions.webGLVersion}
   * @default 2
   */ preferWebGLVersion: 2,
    /**
   * {@link WebGLOptions.multiView}
   * @default false
   */ multiView: false
};
let GlContextSystem = _GlContextSystem;
;
 //# sourceMappingURL=GlContextSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/ensureAttributes.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ensureAttributes",
    ()=>ensureAttributes
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$getAttributeInfoFromFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/utils/getAttributeInfoFromFormat.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
function ensureAttributes(geometry, extractedData) {
    for(const i in geometry.attributes){
        const attribute = geometry.attributes[i];
        const attributeData = extractedData[i];
        if (attributeData) {
            attribute.format ?? (attribute.format = attributeData.format);
            attribute.offset ?? (attribute.offset = attributeData.offset);
            attribute.instance ?? (attribute.instance = attributeData.instance);
        } else {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])(`Attribute ${i} is not present in the shader, but is present in the geometry. Unable to infer attribute details.`);
        }
    }
    ensureStartAndStride(geometry);
}
function ensureStartAndStride(geometry) {
    const { buffers, attributes } = geometry;
    const tempStride = {};
    const tempStart = {};
    for(const j in buffers){
        const buffer = buffers[j];
        tempStride[buffer.uid] = 0;
        tempStart[buffer.uid] = 0;
    }
    for(const j in attributes){
        const attribute = attributes[j];
        tempStride[attribute.buffer.uid] += (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$getAttributeInfoFromFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAttributeInfoFromFormat"])(attribute.format).stride;
    }
    for(const j in attributes){
        const attribute = attributes[j];
        attribute.stride ?? (attribute.stride = tempStride[attribute.buffer.uid]);
        attribute.start ?? (attribute.start = tempStart[attribute.buffer.uid]);
        tempStart[attribute.buffer.uid] += (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$getAttributeInfoFromFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAttributeInfoFromFormat"])(attribute.format).stride;
    }
}
;
 //# sourceMappingURL=ensureAttributes.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/const.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GL_FORMATS",
    ()=>GL_FORMATS,
    "GL_TARGETS",
    ()=>GL_TARGETS,
    "GL_TYPES",
    ()=>GL_TYPES,
    "GL_WRAP_MODES",
    ()=>GL_WRAP_MODES
]);
"use strict";
var GL_FORMATS = /* @__PURE__ */ ((GL_FORMATS2)=>{
    GL_FORMATS2[GL_FORMATS2["RGBA"] = 6408] = "RGBA";
    GL_FORMATS2[GL_FORMATS2["RGB"] = 6407] = "RGB";
    GL_FORMATS2[GL_FORMATS2["RG"] = 33319] = "RG";
    GL_FORMATS2[GL_FORMATS2["RED"] = 6403] = "RED";
    GL_FORMATS2[GL_FORMATS2["RGBA_INTEGER"] = 36249] = "RGBA_INTEGER";
    GL_FORMATS2[GL_FORMATS2["RGB_INTEGER"] = 36248] = "RGB_INTEGER";
    GL_FORMATS2[GL_FORMATS2["RG_INTEGER"] = 33320] = "RG_INTEGER";
    GL_FORMATS2[GL_FORMATS2["RED_INTEGER"] = 36244] = "RED_INTEGER";
    GL_FORMATS2[GL_FORMATS2["ALPHA"] = 6406] = "ALPHA";
    GL_FORMATS2[GL_FORMATS2["LUMINANCE"] = 6409] = "LUMINANCE";
    GL_FORMATS2[GL_FORMATS2["LUMINANCE_ALPHA"] = 6410] = "LUMINANCE_ALPHA";
    GL_FORMATS2[GL_FORMATS2["DEPTH_COMPONENT"] = 6402] = "DEPTH_COMPONENT";
    GL_FORMATS2[GL_FORMATS2["DEPTH_STENCIL"] = 34041] = "DEPTH_STENCIL";
    return GL_FORMATS2;
})(GL_FORMATS || {});
var GL_TARGETS = /* @__PURE__ */ ((GL_TARGETS2)=>{
    GL_TARGETS2[GL_TARGETS2["TEXTURE_2D"] = 3553] = "TEXTURE_2D";
    GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP"] = 34067] = "TEXTURE_CUBE_MAP";
    GL_TARGETS2[GL_TARGETS2["TEXTURE_2D_ARRAY"] = 35866] = "TEXTURE_2D_ARRAY";
    GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP_POSITIVE_X"] = 34069] = "TEXTURE_CUBE_MAP_POSITIVE_X";
    GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP_NEGATIVE_X"] = 34070] = "TEXTURE_CUBE_MAP_NEGATIVE_X";
    GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP_POSITIVE_Y"] = 34071] = "TEXTURE_CUBE_MAP_POSITIVE_Y";
    GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP_NEGATIVE_Y"] = 34072] = "TEXTURE_CUBE_MAP_NEGATIVE_Y";
    GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP_POSITIVE_Z"] = 34073] = "TEXTURE_CUBE_MAP_POSITIVE_Z";
    GL_TARGETS2[GL_TARGETS2["TEXTURE_CUBE_MAP_NEGATIVE_Z"] = 34074] = "TEXTURE_CUBE_MAP_NEGATIVE_Z";
    return GL_TARGETS2;
})(GL_TARGETS || {});
var GL_WRAP_MODES = /* @__PURE__ */ ((GL_WRAP_MODES2)=>{
    GL_WRAP_MODES2[GL_WRAP_MODES2["CLAMP"] = 33071] = "CLAMP";
    GL_WRAP_MODES2[GL_WRAP_MODES2["REPEAT"] = 10497] = "REPEAT";
    GL_WRAP_MODES2[GL_WRAP_MODES2["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
    return GL_WRAP_MODES2;
})(GL_WRAP_MODES || {});
var GL_TYPES = /* @__PURE__ */ ((GL_TYPES2)=>{
    GL_TYPES2[GL_TYPES2["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
    GL_TYPES2[GL_TYPES2["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
    GL_TYPES2[GL_TYPES2["UNSIGNED_SHORT_5_6_5"] = 33635] = "UNSIGNED_SHORT_5_6_5";
    GL_TYPES2[GL_TYPES2["UNSIGNED_SHORT_4_4_4_4"] = 32819] = "UNSIGNED_SHORT_4_4_4_4";
    GL_TYPES2[GL_TYPES2["UNSIGNED_SHORT_5_5_5_1"] = 32820] = "UNSIGNED_SHORT_5_5_5_1";
    GL_TYPES2[GL_TYPES2["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
    GL_TYPES2[GL_TYPES2["UNSIGNED_INT_10F_11F_11F_REV"] = 35899] = "UNSIGNED_INT_10F_11F_11F_REV";
    GL_TYPES2[GL_TYPES2["UNSIGNED_INT_2_10_10_10_REV"] = 33640] = "UNSIGNED_INT_2_10_10_10_REV";
    GL_TYPES2[GL_TYPES2["UNSIGNED_INT_24_8"] = 34042] = "UNSIGNED_INT_24_8";
    GL_TYPES2[GL_TYPES2["UNSIGNED_INT_5_9_9_9_REV"] = 35902] = "UNSIGNED_INT_5_9_9_9_REV";
    GL_TYPES2[GL_TYPES2["BYTE"] = 5120] = "BYTE";
    GL_TYPES2[GL_TYPES2["SHORT"] = 5122] = "SHORT";
    GL_TYPES2[GL_TYPES2["INT"] = 5124] = "INT";
    GL_TYPES2[GL_TYPES2["FLOAT"] = 5126] = "FLOAT";
    GL_TYPES2[GL_TYPES2["FLOAT_32_UNSIGNED_INT_24_8_REV"] = 36269] = "FLOAT_32_UNSIGNED_INT_24_8_REV";
    GL_TYPES2[GL_TYPES2["HALF_FLOAT"] = 36193] = "HALF_FLOAT";
    return GL_TYPES2;
})(GL_TYPES || {});
;
 //# sourceMappingURL=const.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/geometry/utils/getGlTypeFromFormat.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getGlTypeFromFormat",
    ()=>getGlTypeFromFormat
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/const.mjs [app-ssr] (ecmascript)");
;
"use strict";
const infoMap = {
    uint8x2: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].UNSIGNED_BYTE,
    uint8x4: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].UNSIGNED_BYTE,
    sint8x2: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].BYTE,
    sint8x4: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].BYTE,
    unorm8x2: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].UNSIGNED_BYTE,
    unorm8x4: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].UNSIGNED_BYTE,
    snorm8x2: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].BYTE,
    snorm8x4: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].BYTE,
    uint16x2: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].UNSIGNED_SHORT,
    uint16x4: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].UNSIGNED_SHORT,
    sint16x2: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].SHORT,
    sint16x4: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].SHORT,
    unorm16x2: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].UNSIGNED_SHORT,
    unorm16x4: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].UNSIGNED_SHORT,
    snorm16x2: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].SHORT,
    snorm16x4: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].SHORT,
    float16x2: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].HALF_FLOAT,
    float16x4: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].HALF_FLOAT,
    float32: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].FLOAT,
    float32x2: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].FLOAT,
    float32x3: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].FLOAT,
    float32x4: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].FLOAT,
    uint32: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].UNSIGNED_INT,
    uint32x2: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].UNSIGNED_INT,
    uint32x3: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].UNSIGNED_INT,
    uint32x4: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].UNSIGNED_INT,
    sint32: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].INT,
    sint32x2: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].INT,
    sint32x3: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].INT,
    sint32x4: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].INT
};
function getGlTypeFromFormat(format) {
    return infoMap[format] ?? infoMap.float32;
}
;
 //# sourceMappingURL=getGlTypeFromFormat.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/geometry/GlGeometrySystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlGeometrySystem",
    ()=>GlGeometrySystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$getAttributeInfoFromFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/utils/getAttributeInfoFromFormat.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$ensureAttributes$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/ensureAttributes.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$geometry$2f$utils$2f$getGlTypeFromFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/geometry/utils/getGlTypeFromFormat.mjs [app-ssr] (ecmascript)");
;
;
;
;
"use strict";
const topologyToGlMap = {
    "point-list": 0,
    "line-list": 1,
    "line-strip": 3,
    "triangle-list": 4,
    "triangle-strip": 5
};
class GlGeometrySystem {
    /** @param renderer - The renderer this System works for. */ constructor(renderer){
        this._geometryVaoHash = /* @__PURE__ */ Object.create(null);
        this._renderer = renderer;
        this._activeGeometry = null;
        this._activeVao = null;
        this.hasVao = true;
        this.hasInstance = true;
        this._renderer.renderableGC.addManagedHash(this, "_geometryVaoHash");
    }
    /** Sets up the renderer context and necessary buffers. */ contextChange() {
        const gl = this.gl = this._renderer.gl;
        if (!this._renderer.context.supports.vertexArrayObject) {
            throw new Error("[PixiJS] Vertex Array Objects are not supported on this device");
        }
        const nativeVaoExtension = this._renderer.context.extensions.vertexArrayObject;
        if (nativeVaoExtension) {
            gl.createVertexArray = ()=>nativeVaoExtension.createVertexArrayOES();
            gl.bindVertexArray = (vao)=>nativeVaoExtension.bindVertexArrayOES(vao);
            gl.deleteVertexArray = (vao)=>nativeVaoExtension.deleteVertexArrayOES(vao);
        }
        const nativeInstancedExtension = this._renderer.context.extensions.vertexAttribDivisorANGLE;
        if (nativeInstancedExtension) {
            gl.drawArraysInstanced = (a, b, c, d)=>{
                nativeInstancedExtension.drawArraysInstancedANGLE(a, b, c, d);
            };
            gl.drawElementsInstanced = (a, b, c, d, e)=>{
                nativeInstancedExtension.drawElementsInstancedANGLE(a, b, c, d, e);
            };
            gl.vertexAttribDivisor = (a, b)=>nativeInstancedExtension.vertexAttribDivisorANGLE(a, b);
        }
        this._activeGeometry = null;
        this._activeVao = null;
        this._geometryVaoHash = /* @__PURE__ */ Object.create(null);
    }
    /**
   * Binds geometry so that is can be drawn. Creating a Vao if required
   * @param geometry - Instance of geometry to bind.
   * @param program - Instance of program to use vao for.
   */ bind(geometry, program) {
        const gl = this.gl;
        this._activeGeometry = geometry;
        const vao = this.getVao(geometry, program);
        if (this._activeVao !== vao) {
            this._activeVao = vao;
            gl.bindVertexArray(vao);
        }
        this.updateBuffers();
    }
    /** Reset and unbind any active VAO and geometry. */ resetState() {
        this.unbind();
    }
    /** Update buffers of the currently bound geometry. */ updateBuffers() {
        const geometry = this._activeGeometry;
        const bufferSystem = this._renderer.buffer;
        for(let i = 0; i < geometry.buffers.length; i++){
            const buffer = geometry.buffers[i];
            bufferSystem.updateBuffer(buffer);
        }
    }
    /**
   * Check compatibility between a geometry and a program
   * @param geometry - Geometry instance.
   * @param program - Program instance.
   */ checkCompatibility(geometry, program) {
        const geometryAttributes = geometry.attributes;
        const shaderAttributes = program._attributeData;
        for(const j in shaderAttributes){
            if (!geometryAttributes[j]) {
                throw new Error(`shader and geometry incompatible, geometry missing the "${j}" attribute`);
            }
        }
    }
    /**
   * Takes a geometry and program and generates a unique signature for them.
   * @param geometry - To get signature from.
   * @param program - To test geometry against.
   * @returns - Unique signature of the geometry and program
   */ getSignature(geometry, program) {
        const attribs = geometry.attributes;
        const shaderAttributes = program._attributeData;
        const strings = [
            "g",
            geometry.uid
        ];
        for(const i in attribs){
            if (shaderAttributes[i]) {
                strings.push(i, shaderAttributes[i].location);
            }
        }
        return strings.join("-");
    }
    getVao(geometry, program) {
        return this._geometryVaoHash[geometry.uid]?.[program._key] || this.initGeometryVao(geometry, program);
    }
    /**
   * Creates or gets Vao with the same structure as the geometry and stores it on the geometry.
   * If vao is created, it is bound automatically. We use a shader to infer what and how to set up the
   * attribute locations.
   * @param geometry - Instance of geometry to to generate Vao for.
   * @param program
   * @param _incRefCount - Increment refCount of all geometry buffers.
   */ initGeometryVao(geometry, program, _incRefCount = true) {
        const gl = this._renderer.gl;
        const bufferSystem = this._renderer.buffer;
        this._renderer.shader._getProgramData(program);
        this.checkCompatibility(geometry, program);
        const signature = this.getSignature(geometry, program);
        if (!this._geometryVaoHash[geometry.uid]) {
            this._geometryVaoHash[geometry.uid] = /* @__PURE__ */ Object.create(null);
            geometry.on("destroy", this.onGeometryDestroy, this);
        }
        const vaoObjectHash = this._geometryVaoHash[geometry.uid];
        let vao = vaoObjectHash[signature];
        if (vao) {
            vaoObjectHash[program._key] = vao;
            return vao;
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$ensureAttributes$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ensureAttributes"])(geometry, program._attributeData);
        const buffers = geometry.buffers;
        vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        for(let i = 0; i < buffers.length; i++){
            const buffer = buffers[i];
            bufferSystem.bind(buffer);
        }
        this.activateVao(geometry, program);
        vaoObjectHash[program._key] = vao;
        vaoObjectHash[signature] = vao;
        gl.bindVertexArray(null);
        return vao;
    }
    /**
   * Disposes geometry.
   * @param geometry - Geometry with buffers. Only VAO will be disposed
   * @param [contextLost=false] - If context was lost, we suppress deleteVertexArray
   */ onGeometryDestroy(geometry, contextLost) {
        const vaoObjectHash = this._geometryVaoHash[geometry.uid];
        const gl = this.gl;
        if (vaoObjectHash) {
            if (contextLost) {
                for(const i in vaoObjectHash){
                    if (this._activeVao !== vaoObjectHash[i]) {
                        this.unbind();
                    }
                    gl.deleteVertexArray(vaoObjectHash[i]);
                }
            }
            this._geometryVaoHash[geometry.uid] = null;
        }
    }
    /**
   * Dispose all WebGL resources of all managed geometries.
   * @param [contextLost=false] - If context was lost, we suppress `gl.delete` calls
   */ destroyAll(contextLost = false) {
        const gl = this.gl;
        for(const i in this._geometryVaoHash){
            if (contextLost) {
                for(const j in this._geometryVaoHash[i]){
                    const vaoObjectHash = this._geometryVaoHash[i];
                    if (this._activeVao !== vaoObjectHash) {
                        this.unbind();
                    }
                    gl.deleteVertexArray(vaoObjectHash[j]);
                }
            }
            this._geometryVaoHash[i] = null;
        }
    }
    /**
   * Activate vertex array object.
   * @param geometry - Geometry instance.
   * @param program - Shader program instance.
   */ activateVao(geometry, program) {
        const gl = this._renderer.gl;
        const bufferSystem = this._renderer.buffer;
        const attributes = geometry.attributes;
        if (geometry.indexBuffer) {
            bufferSystem.bind(geometry.indexBuffer);
        }
        let lastBuffer = null;
        for(const j in attributes){
            const attribute = attributes[j];
            const buffer = attribute.buffer;
            const glBuffer = bufferSystem.getGlBuffer(buffer);
            const programAttrib = program._attributeData[j];
            if (programAttrib) {
                if (lastBuffer !== glBuffer) {
                    bufferSystem.bind(buffer);
                    lastBuffer = glBuffer;
                }
                const location = programAttrib.location;
                gl.enableVertexAttribArray(location);
                const attributeInfo = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$getAttributeInfoFromFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAttributeInfoFromFormat"])(attribute.format);
                const type = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$geometry$2f$utils$2f$getGlTypeFromFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getGlTypeFromFormat"])(attribute.format);
                if (programAttrib.format?.substring(1, 4) === "int") {
                    gl.vertexAttribIPointer(location, attributeInfo.size, type, attribute.stride, attribute.offset);
                } else {
                    gl.vertexAttribPointer(location, attributeInfo.size, type, attributeInfo.normalised, attribute.stride, attribute.offset);
                }
                if (attribute.instance) {
                    if (this.hasInstance) {
                        const divisor = attribute.divisor ?? 1;
                        gl.vertexAttribDivisor(location, divisor);
                    } else {
                        throw new Error("geometry error, GPU Instancing is not supported on this device");
                    }
                }
            }
        }
    }
    /**
   * Draws the currently bound geometry.
   * @param topology - The type primitive to render.
   * @param size - The number of elements to be rendered. If not specified, all vertices after the
   *  starting vertex will be drawn.
   * @param start - The starting vertex in the geometry to start drawing from. If not specified,
   *  drawing will start from the first vertex.
   * @param instanceCount - The number of instances of the set of elements to execute. If not specified,
   *  all instances will be drawn.
   * @returns This instance of the geometry system.
   */ draw(topology, size, start, instanceCount) {
        const { gl } = this._renderer;
        const geometry = this._activeGeometry;
        const glTopology = topologyToGlMap[topology || geometry.topology];
        instanceCount ?? (instanceCount = geometry.instanceCount);
        if (geometry.indexBuffer) {
            const byteSize = geometry.indexBuffer.data.BYTES_PER_ELEMENT;
            const glType = byteSize === 2 ? gl.UNSIGNED_SHORT : gl.UNSIGNED_INT;
            if (instanceCount > 1) {
                gl.drawElementsInstanced(glTopology, size || geometry.indexBuffer.data.length, glType, (start || 0) * byteSize, instanceCount);
            } else {
                gl.drawElements(glTopology, size || geometry.indexBuffer.data.length, glType, (start || 0) * byteSize);
            }
        } else if (instanceCount > 1) {
            gl.drawArraysInstanced(glTopology, start || 0, size || geometry.getSize(), instanceCount);
        } else {
            gl.drawArrays(glTopology, start || 0, size || geometry.getSize());
        }
        return this;
    }
    /** Unbind/reset everything. */ unbind() {
        this.gl.bindVertexArray(null);
        this._activeVao = null;
        this._activeGeometry = null;
    }
    destroy() {
        this._renderer = null;
        this.gl = null;
        this._activeVao = null;
        this._activeGeometry = null;
        this._geometryVaoHash = null;
    }
}
/** @ignore */ GlGeometrySystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem
    ],
    name: "geometry"
};
;
 //# sourceMappingURL=GlGeometrySystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/GlBackBufferSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlBackBufferSystem",
    ()=>GlBackBufferSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$Geometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/Geometry.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/Shader.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/State.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/TextureSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlProgram.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
"use strict";
const bigTriangleGeometry = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$Geometry$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Geometry"]({
    attributes: {
        aPosition: [
            -1,
            -1,
            // Bottom left corner
            3,
            -1,
            // Bottom right corner, extending beyond right edge
            -1,
            3
        ]
    }
});
const _GlBackBufferSystem = class _GlBackBufferSystem {
    constructor(renderer){
        /** if true, the back buffer is used */ this.useBackBuffer = false;
        this._useBackBufferThisRender = false;
        this._renderer = renderer;
    }
    init(options = {}) {
        const { useBackBuffer, antialias } = {
            ..._GlBackBufferSystem.defaultOptions,
            ...options
        };
        this.useBackBuffer = useBackBuffer;
        this._antialias = antialias;
        if (!this._renderer.context.supports.msaa) {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("antialiasing, is not supported on when using the back buffer");
            this._antialias = false;
        }
        this._state = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"].for2d();
        const bigTriangleProgram = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlProgram"]({
            vertex: `
                attribute vec2 aPosition;
                out vec2 vUv;

                void main() {
                    gl_Position = vec4(aPosition, 0.0, 1.0);

                    vUv = (aPosition + 1.0) / 2.0;

                    // flip dem UVs
                    vUv.y = 1.0 - vUv.y;
                }`,
            fragment: `
                in vec2 vUv;
                out vec4 finalColor;

                uniform sampler2D uTexture;

                void main() {
                    finalColor = texture(uTexture, vUv);
                }`,
            name: "big-triangle"
        });
        this._bigTriangleShader = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$Shader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Shader"]({
            glProgram: bigTriangleProgram,
            resources: {
                uTexture: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"].WHITE.source
            }
        });
    }
    /**
   * This is called before the RenderTargetSystem is started. This is where
   * we replace the target with the back buffer if required.
   * @param options - The options for this render.
   */ renderStart(options) {
        const renderTarget = this._renderer.renderTarget.getRenderTarget(options.target);
        this._useBackBufferThisRender = this.useBackBuffer && !!renderTarget.isRoot;
        if (this._useBackBufferThisRender) {
            const renderTarget2 = this._renderer.renderTarget.getRenderTarget(options.target);
            this._targetTexture = renderTarget2.colorTexture;
            options.target = this._getBackBufferTexture(renderTarget2.colorTexture);
        }
    }
    renderEnd() {
        this._presentBackBuffer();
    }
    _presentBackBuffer() {
        const renderer = this._renderer;
        renderer.renderTarget.finishRenderPass();
        if (!this._useBackBufferThisRender) return;
        renderer.renderTarget.bind(this._targetTexture, false);
        this._bigTriangleShader.resources.uTexture = this._backBufferTexture.source;
        renderer.encoder.draw({
            geometry: bigTriangleGeometry,
            shader: this._bigTriangleShader,
            state: this._state
        });
    }
    _getBackBufferTexture(targetSourceTexture) {
        this._backBufferTexture = this._backBufferTexture || new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"]({
            source: new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureSource"]({
                width: targetSourceTexture.width,
                height: targetSourceTexture.height,
                resolution: targetSourceTexture._resolution,
                antialias: this._antialias
            })
        });
        this._backBufferTexture.source.resize(targetSourceTexture.width, targetSourceTexture.height, targetSourceTexture._resolution);
        return this._backBufferTexture;
    }
    /** destroys the back buffer */ destroy() {
        if (this._backBufferTexture) {
            this._backBufferTexture.destroy();
            this._backBufferTexture = null;
        }
    }
};
/** @ignore */ _GlBackBufferSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem
    ],
    name: "backBuffer",
    priority: 1
};
/** default options for the back buffer system */ _GlBackBufferSystem.defaultOptions = {
    /** if true will use the back buffer where required */ useBackBuffer: false
};
let GlBackBufferSystem = _GlBackBufferSystem;
;
 //# sourceMappingURL=GlBackBufferSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/GlColorMaskSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlColorMaskSystem",
    ()=>GlColorMaskSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
;
"use strict";
class GlColorMaskSystem {
    constructor(renderer){
        this._colorMaskCache = 15;
        this._renderer = renderer;
    }
    setMask(colorMask) {
        if (this._colorMaskCache === colorMask) return;
        this._colorMaskCache = colorMask;
        this._renderer.gl.colorMask(!!(colorMask & 8), !!(colorMask & 4), !!(colorMask & 2), !!(colorMask & 1));
    }
}
/** @ignore */ GlColorMaskSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem
    ],
    name: "colorMask"
};
;
 //# sourceMappingURL=GlColorMaskSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/GlEncoderSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlEncoderSystem",
    ()=>GlEncoderSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
;
"use strict";
class GlEncoderSystem {
    constructor(renderer){
        this.commandFinished = Promise.resolve();
        this._renderer = renderer;
    }
    setGeometry(geometry, shader) {
        this._renderer.geometry.bind(geometry, shader.glProgram);
    }
    finishRenderPass() {}
    draw(options) {
        const renderer = this._renderer;
        const { geometry, shader, state, skipSync, topology: type, size, start, instanceCount } = options;
        renderer.shader.bind(shader, skipSync);
        renderer.geometry.bind(geometry, renderer.shader._activeProgram);
        if (state) {
            renderer.state.set(state);
        }
        renderer.geometry.draw(type, size, start, instanceCount ?? geometry.instanceCount);
    }
    destroy() {
        this._renderer = null;
    }
}
/** @ignore */ GlEncoderSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem
    ],
    name: "encoder"
};
;
 //# sourceMappingURL=GlEncoderSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/GlLimitsSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlLimitsSystem",
    ()=>GlLimitsSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$gl$2f$utils$2f$checkMaxIfStatementsInShader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/gl/utils/checkMaxIfStatementsInShader.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
class GlLimitsSystem {
    constructor(renderer){
        this._renderer = renderer;
    }
    contextChange() {
        const gl = this._renderer.gl;
        this.maxTextures = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
        this.maxBatchableTextures = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$gl$2f$utils$2f$checkMaxIfStatementsInShader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["checkMaxIfStatementsInShader"])(this.maxTextures, gl);
        const isWebGl2 = this._renderer.context.webGLVersion === 2;
        this.maxUniformBindings = isWebGl2 ? gl.getParameter(gl.MAX_UNIFORM_BUFFER_BINDINGS) : 0;
    }
    destroy() {}
}
/** @ignore */ GlLimitsSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem
    ],
    name: "limits"
};
;
 //# sourceMappingURL=GlLimitsSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/state/GpuStencilModesToPixi.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GpuStencilModesToPixi",
    ()=>GpuStencilModesToPixi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/const.mjs [app-ssr] (ecmascript)");
;
"use strict";
const GpuStencilModesToPixi = [];
GpuStencilModesToPixi[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].NONE] = void 0;
GpuStencilModesToPixi[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].DISABLED] = {
    stencilWriteMask: 0,
    stencilReadMask: 0
};
GpuStencilModesToPixi[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].RENDERING_MASK_ADD] = {
    stencilFront: {
        compare: "equal",
        passOp: "increment-clamp"
    },
    stencilBack: {
        compare: "equal",
        passOp: "increment-clamp"
    }
};
GpuStencilModesToPixi[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].RENDERING_MASK_REMOVE] = {
    stencilFront: {
        compare: "equal",
        passOp: "decrement-clamp"
    },
    stencilBack: {
        compare: "equal",
        passOp: "decrement-clamp"
    }
};
GpuStencilModesToPixi[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].MASK_ACTIVE] = {
    stencilWriteMask: 0,
    stencilFront: {
        compare: "equal",
        passOp: "keep"
    },
    stencilBack: {
        compare: "equal",
        passOp: "keep"
    }
};
GpuStencilModesToPixi[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].INVERSE_MASK_ACTIVE] = {
    stencilWriteMask: 0,
    stencilFront: {
        compare: "not-equal",
        passOp: "keep"
    },
    stencilBack: {
        compare: "not-equal",
        passOp: "keep"
    }
};
;
 //# sourceMappingURL=GpuStencilModesToPixi.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/GlStencilSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlStencilSystem",
    ()=>GlStencilSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$state$2f$GpuStencilModesToPixi$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/state/GpuStencilModesToPixi.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/const.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
class GlStencilSystem {
    constructor(renderer){
        this._stencilCache = {
            enabled: false,
            stencilReference: 0,
            stencilMode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].NONE
        };
        this._renderTargetStencilState = /* @__PURE__ */ Object.create(null);
        renderer.renderTarget.onRenderTargetChange.add(this);
    }
    contextChange(gl) {
        this._gl = gl;
        this._comparisonFuncMapping = {
            always: gl.ALWAYS,
            never: gl.NEVER,
            equal: gl.EQUAL,
            "not-equal": gl.NOTEQUAL,
            less: gl.LESS,
            "less-equal": gl.LEQUAL,
            greater: gl.GREATER,
            "greater-equal": gl.GEQUAL
        };
        this._stencilOpsMapping = {
            keep: gl.KEEP,
            zero: gl.ZERO,
            replace: gl.REPLACE,
            invert: gl.INVERT,
            "increment-clamp": gl.INCR,
            "decrement-clamp": gl.DECR,
            "increment-wrap": gl.INCR_WRAP,
            "decrement-wrap": gl.DECR_WRAP
        };
        this.resetState();
    }
    onRenderTargetChange(renderTarget) {
        if (this._activeRenderTarget === renderTarget) return;
        this._activeRenderTarget = renderTarget;
        let stencilState = this._renderTargetStencilState[renderTarget.uid];
        if (!stencilState) {
            stencilState = this._renderTargetStencilState[renderTarget.uid] = {
                stencilMode: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].DISABLED,
                stencilReference: 0
            };
        }
        this.setStencilMode(stencilState.stencilMode, stencilState.stencilReference);
    }
    resetState() {
        this._stencilCache.enabled = false;
        this._stencilCache.stencilMode = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].NONE;
        this._stencilCache.stencilReference = 0;
    }
    setStencilMode(stencilMode, stencilReference) {
        const stencilState = this._renderTargetStencilState[this._activeRenderTarget.uid];
        const gl = this._gl;
        const mode = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$state$2f$GpuStencilModesToPixi$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GpuStencilModesToPixi"][stencilMode];
        const _stencilCache = this._stencilCache;
        stencilState.stencilMode = stencilMode;
        stencilState.stencilReference = stencilReference;
        if (stencilMode === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["STENCIL_MODES"].DISABLED) {
            if (this._stencilCache.enabled) {
                this._stencilCache.enabled = false;
                gl.disable(gl.STENCIL_TEST);
            }
            return;
        }
        if (!this._stencilCache.enabled) {
            this._stencilCache.enabled = true;
            gl.enable(gl.STENCIL_TEST);
        }
        if (stencilMode !== _stencilCache.stencilMode || _stencilCache.stencilReference !== stencilReference) {
            _stencilCache.stencilMode = stencilMode;
            _stencilCache.stencilReference = stencilReference;
            gl.stencilFunc(this._comparisonFuncMapping[mode.stencilBack.compare], stencilReference, 255);
            gl.stencilOp(gl.KEEP, gl.KEEP, this._stencilOpsMapping[mode.stencilBack.passOp]);
        }
    }
}
/** @ignore */ GlStencilSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem
    ],
    name: "stencil"
};
;
 //# sourceMappingURL=GlStencilSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UboSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UboSystem",
    ()=>UboSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$browser$2f$unsafeEvalSupported$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/browser/unsafeEvalSupported.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/Buffer.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/const.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
class UboSystem {
    constructor(adaptor){
        /** Cache of uniform buffer layouts and sync functions, so we don't have to re-create them */ this._syncFunctionHash = /* @__PURE__ */ Object.create(null);
        this._adaptor = adaptor;
        this._systemCheck();
    }
    /**
   * Overridable function by `pixi.js/unsafe-eval` to silence
   * throwing an error if platform doesn't support unsafe-evals.
   * @private
   */ _systemCheck() {
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$browser$2f$unsafeEvalSupported$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["unsafeEvalSupported"])()) {
            throw new Error("Current environment does not allow unsafe-eval, please use pixi.js/unsafe-eval module to enable support.");
        }
    }
    ensureUniformGroup(uniformGroup) {
        const uniformData = this.getUniformGroupData(uniformGroup);
        uniformGroup.buffer || (uniformGroup.buffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Buffer"]({
            data: new Float32Array(uniformData.layout.size / 4),
            usage: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].UNIFORM | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].COPY_DST
        }));
    }
    getUniformGroupData(uniformGroup) {
        return this._syncFunctionHash[uniformGroup._signature] || this._initUniformGroup(uniformGroup);
    }
    _initUniformGroup(uniformGroup) {
        const uniformGroupSignature = uniformGroup._signature;
        let uniformData = this._syncFunctionHash[uniformGroupSignature];
        if (!uniformData) {
            const elements = Object.keys(uniformGroup.uniformStructures).map((i)=>uniformGroup.uniformStructures[i]);
            const layout = this._adaptor.createUboElements(elements);
            const syncFunction = this._generateUboSync(layout.uboElements);
            uniformData = this._syncFunctionHash[uniformGroupSignature] = {
                layout,
                syncFunction
            };
        }
        return this._syncFunctionHash[uniformGroupSignature];
    }
    _generateUboSync(uboElements) {
        return this._adaptor.generateUboSync(uboElements);
    }
    syncUniformGroup(uniformGroup, data, offset) {
        const uniformGroupData = this.getUniformGroupData(uniformGroup);
        uniformGroup.buffer || (uniformGroup.buffer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$Buffer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Buffer"]({
            data: new Float32Array(uniformGroupData.layout.size / 4),
            usage: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].UNIFORM | __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferUsage"].COPY_DST
        }));
        let dataInt32 = null;
        if (!data) {
            data = uniformGroup.buffer.data;
            dataInt32 = uniformGroup.buffer.dataInt32;
        }
        offset || (offset = 0);
        uniformGroupData.syncFunction(uniformGroup.uniforms, data, dataInt32, offset);
        return true;
    }
    updateUniformGroup(uniformGroup) {
        if (uniformGroup.isStatic && !uniformGroup._dirtyId) return false;
        uniformGroup._dirtyId = 0;
        const synced = this.syncUniformGroup(uniformGroup);
        uniformGroup.buffer.update();
        return synced;
    }
    destroy() {
        this._syncFunctionHash = null;
    }
}
;
 //# sourceMappingURL=UboSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/createUboElementsSTD40.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WGSL_TO_STD40_SIZE",
    ()=>WGSL_TO_STD40_SIZE,
    "createUboElementsSTD40",
    ()=>createUboElementsSTD40
]);
"use strict";
const WGSL_TO_STD40_SIZE = {
    f32: 4,
    i32: 4,
    "vec2<f32>": 8,
    "vec3<f32>": 12,
    "vec4<f32>": 16,
    "vec2<i32>": 8,
    "vec3<i32>": 12,
    "vec4<i32>": 16,
    "mat2x2<f32>": 16 * 2,
    "mat3x3<f32>": 16 * 3,
    "mat4x4<f32>": 16 * 4
};
function createUboElementsSTD40(uniformData) {
    const uboElements = uniformData.map((data)=>({
            data,
            offset: 0,
            size: 0
        }));
    const chunkSize = 16;
    let size = 0;
    let offset = 0;
    for(let i = 0; i < uboElements.length; i++){
        const uboElement = uboElements[i];
        size = WGSL_TO_STD40_SIZE[uboElement.data.type];
        if (!size) {
            throw new Error(`Unknown type ${uboElement.data.type}`);
        }
        if (uboElement.data.size > 1) {
            size = Math.max(size, chunkSize) * uboElement.data.size;
        }
        const boundary = size === 12 ? 16 : size;
        uboElement.size = size;
        const curOffset = offset % chunkSize;
        if (curOffset > 0 && chunkSize - curOffset < boundary) {
            offset += (chunkSize - curOffset) % 16;
        } else {
            offset += (size - curOffset % size) % size;
        }
        uboElement.offset = offset;
        offset += size;
    }
    offset = Math.ceil(offset / 16) * 16;
    return {
        uboElements,
        size: offset
    };
}
;
 //# sourceMappingURL=createUboElementsSTD40.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/utils/uniformParsers.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "uniformParsers",
    ()=>uniformParsers
]);
"use strict";
const uniformParsers = [
    // uploading pixi matrix object to mat3
    {
        type: "mat3x3<f32>",
        test: (data)=>{
            const value = data.value;
            return value.a !== void 0;
        },
        ubo: `
            var matrix = uv[name].toArray(true);
            data[offset] = matrix[0];
            data[offset + 1] = matrix[1];
            data[offset + 2] = matrix[2];
            data[offset + 4] = matrix[3];
            data[offset + 5] = matrix[4];
            data[offset + 6] = matrix[5];
            data[offset + 8] = matrix[6];
            data[offset + 9] = matrix[7];
            data[offset + 10] = matrix[8];
        `,
        uniform: `
            gl.uniformMatrix3fv(ud[name].location, false, uv[name].toArray(true));
        `
    },
    // uploading a pixi rectangle as a vec4
    {
        type: "vec4<f32>",
        test: (data)=>data.type === "vec4<f32>" && data.size === 1 && data.value.width !== void 0,
        ubo: `
            v = uv[name];
            data[offset] = v.x;
            data[offset + 1] = v.y;
            data[offset + 2] = v.width;
            data[offset + 3] = v.height;
        `,
        uniform: `
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.x || cv[1] !== v.y || cv[2] !== v.width || cv[3] !== v.height) {
                cv[0] = v.x;
                cv[1] = v.y;
                cv[2] = v.width;
                cv[3] = v.height;
                gl.uniform4f(ud[name].location, v.x, v.y, v.width, v.height);
            }
        `
    },
    // uploading a pixi point as a vec2
    {
        type: "vec2<f32>",
        test: (data)=>data.type === "vec2<f32>" && data.size === 1 && data.value.x !== void 0,
        ubo: `
            v = uv[name];
            data[offset] = v.x;
            data[offset + 1] = v.y;
        `,
        uniform: `
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.x || cv[1] !== v.y) {
                cv[0] = v.x;
                cv[1] = v.y;
                gl.uniform2f(ud[name].location, v.x, v.y);
            }
        `
    },
    // uploading a pixi color as a vec4
    {
        type: "vec4<f32>",
        test: (data)=>data.type === "vec4<f32>" && data.size === 1 && data.value.red !== void 0,
        ubo: `
            v = uv[name];
            data[offset] = v.red;
            data[offset + 1] = v.green;
            data[offset + 2] = v.blue;
            data[offset + 3] = v.alpha;
        `,
        uniform: `
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.red || cv[1] !== v.green || cv[2] !== v.blue || cv[3] !== v.alpha) {
                cv[0] = v.red;
                cv[1] = v.green;
                cv[2] = v.blue;
                cv[3] = v.alpha;
                gl.uniform4f(ud[name].location, v.red, v.green, v.blue, v.alpha);
            }
        `
    },
    // uploading a pixi color as a vec3
    {
        type: "vec3<f32>",
        test: (data)=>data.type === "vec3<f32>" && data.size === 1 && data.value.red !== void 0,
        ubo: `
            v = uv[name];
            data[offset] = v.red;
            data[offset + 1] = v.green;
            data[offset + 2] = v.blue;
        `,
        uniform: `
            cv = ud[name].value;
            v = uv[name];
            if (cv[0] !== v.red || cv[1] !== v.green || cv[2] !== v.blue) {
                cv[0] = v.red;
                cv[1] = v.green;
                cv[2] = v.blue;
                gl.uniform3f(ud[name].location, v.red, v.green, v.blue);
            }
        `
    }
];
;
 //# sourceMappingURL=uniformParsers.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/utils/createUboSyncFunction.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createUboSyncFunction",
    ()=>createUboSyncFunction
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$uniformParsers$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/utils/uniformParsers.mjs [app-ssr] (ecmascript)");
;
"use strict";
function createUboSyncFunction(uboElements, parserCode, arrayGenerationFunction, singleSettersMap) {
    const funcFragments = [
        `
        var v = null;
        var v2 = null;
        var t = 0;
        var index = 0;
        var name = null;
        var arrayOffset = null;
    `
    ];
    let prev = 0;
    for(let i = 0; i < uboElements.length; i++){
        const uboElement = uboElements[i];
        const name = uboElement.data.name;
        let parsed = false;
        let offset = 0;
        for(let j = 0; j < __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$uniformParsers$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uniformParsers"].length; j++){
            const uniformParser = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$uniformParsers$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uniformParsers"][j];
            if (uniformParser.test(uboElement.data)) {
                offset = uboElement.offset / 4;
                funcFragments.push(`name = "${name}";`, `offset += ${offset - prev};`, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$uniformParsers$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uniformParsers"][j][parserCode] || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$uniformParsers$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uniformParsers"][j].ubo);
                parsed = true;
                break;
            }
        }
        if (!parsed) {
            if (uboElement.data.size > 1) {
                offset = uboElement.offset / 4;
                funcFragments.push(arrayGenerationFunction(uboElement, offset - prev));
            } else {
                const template = singleSettersMap[uboElement.data.type];
                offset = uboElement.offset / 4;
                funcFragments.push(/* wgsl */ `
                    v = uv.${name};
                    offset += ${offset - prev};
                    ${template};
                `);
            }
        }
        prev = offset;
    }
    const fragmentSrc = funcFragments.join("\n");
    return new Function("uv", "data", "dataInt32", "offset", fragmentSrc);
}
;
 //# sourceMappingURL=createUboSyncFunction.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/utils/uboSyncFunctions.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "uboSyncFunctionsSTD40",
    ()=>uboSyncFunctionsSTD40,
    "uboSyncFunctionsWGSL",
    ()=>uboSyncFunctionsWGSL
]);
"use strict";
function loopMatrix(col, row) {
    const total = col * row;
    return `
        for (let i = 0; i < ${total}; i++) {
            data[offset + (((i / ${col})|0) * 4) + (i % ${col})] = v[i];
        }
    `;
}
const uboSyncFunctionsSTD40 = {
    f32: `
        data[offset] = v;`,
    i32: `
        dataInt32[offset] = v;`,
    "vec2<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];`,
    "vec3<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];`,
    "vec4<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 3] = v[3];`,
    "vec2<i32>": `
        dataInt32[offset] = v[0];
        dataInt32[offset + 1] = v[1];`,
    "vec3<i32>": `
        dataInt32[offset] = v[0];
        dataInt32[offset + 1] = v[1];
        dataInt32[offset + 2] = v[2];`,
    "vec4<i32>": `
        dataInt32[offset] = v[0];
        dataInt32[offset + 1] = v[1];
        dataInt32[offset + 2] = v[2];
        dataInt32[offset + 3] = v[3];`,
    "mat2x2<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 4] = v[2];
        data[offset + 5] = v[3];`,
    "mat3x3<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 4] = v[3];
        data[offset + 5] = v[4];
        data[offset + 6] = v[5];
        data[offset + 8] = v[6];
        data[offset + 9] = v[7];
        data[offset + 10] = v[8];`,
    "mat4x4<f32>": `
        for (let i = 0; i < 16; i++) {
            data[offset + i] = v[i];
        }`,
    "mat3x2<f32>": loopMatrix(3, 2),
    "mat4x2<f32>": loopMatrix(4, 2),
    "mat2x3<f32>": loopMatrix(2, 3),
    "mat4x3<f32>": loopMatrix(4, 3),
    "mat2x4<f32>": loopMatrix(2, 4),
    "mat3x4<f32>": loopMatrix(3, 4)
};
const uboSyncFunctionsWGSL = {
    ...uboSyncFunctionsSTD40,
    "mat2x2<f32>": `
        data[offset] = v[0];
        data[offset + 1] = v[1];
        data[offset + 2] = v[2];
        data[offset + 3] = v[3];
    `
};
;
 //# sourceMappingURL=uboSyncFunctions.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/generateArraySyncSTD40.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateArraySyncSTD40",
    ()=>generateArraySyncSTD40
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$utils$2f$createUboElementsSTD40$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/createUboElementsSTD40.mjs [app-ssr] (ecmascript)");
;
"use strict";
function generateArraySyncSTD40(uboElement, offsetToAdd) {
    const rowSize = Math.max(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$utils$2f$createUboElementsSTD40$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WGSL_TO_STD40_SIZE"][uboElement.data.type] / 16, 1);
    const elementSize = uboElement.data.value.length / uboElement.data.size;
    const remainder = (4 - elementSize % 4) % 4;
    const data = uboElement.data.type.indexOf("i32") >= 0 ? "dataInt32" : "data";
    return `
        v = uv.${uboElement.data.name};
        offset += ${offsetToAdd};

        arrayOffset = offset;

        t = 0;

        for(var i=0; i < ${uboElement.data.size * rowSize}; i++)
        {
            for(var j = 0; j < ${elementSize}; j++)
            {
                ${data}[arrayOffset++] = v[t++];
            }
            ${remainder !== 0 ? `arrayOffset += ${remainder};` : ""}
        }
    `;
}
;
 //# sourceMappingURL=generateArraySyncSTD40.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/createUboSyncSTD40.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createUboSyncFunctionSTD40",
    ()=>createUboSyncFunctionSTD40
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$createUboSyncFunction$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/utils/createUboSyncFunction.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$uboSyncFunctions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/utils/uboSyncFunctions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$utils$2f$generateArraySyncSTD40$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/generateArraySyncSTD40.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
function createUboSyncFunctionSTD40(uboElements) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$createUboSyncFunction$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createUboSyncFunction"])(uboElements, "uboStd40", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$utils$2f$generateArraySyncSTD40$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateArraySyncSTD40"], __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$uboSyncFunctions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uboSyncFunctionsSTD40"]);
}
;
 //# sourceMappingURL=createUboSyncSTD40.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/GlUboSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlUboSystem",
    ()=>GlUboSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UboSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UboSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$utils$2f$createUboElementsSTD40$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/createUboElementsSTD40.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$utils$2f$createUboSyncSTD40$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/createUboSyncSTD40.mjs [app-ssr] (ecmascript)");
;
;
;
;
"use strict";
class GlUboSystem extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UboSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UboSystem"] {
    constructor(){
        super({
            createUboElements: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$utils$2f$createUboElementsSTD40$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createUboElementsSTD40"],
            generateUboSync: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$utils$2f$createUboSyncSTD40$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createUboSyncFunctionSTD40"]
        });
    }
}
/** @ignore */ GlUboSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem
    ],
    name: "ubo"
};
;
 //# sourceMappingURL=GlUboSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/renderTarget/calculateProjection.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateProjection",
    ()=>calculateProjection
]);
"use strict";
function calculateProjection(pm, x, y, width, height, flipY) {
    const sign = flipY ? 1 : -1;
    pm.identity();
    pm.a = 1 / width * 2;
    pm.d = sign * (1 / height * 2);
    pm.tx = -1 - x * pm.a;
    pm.ty = -sign - y * pm.d;
    return pm;
}
;
 //# sourceMappingURL=calculateProjection.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/renderTarget/isRenderingToScreen.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isRenderingToScreen",
    ()=>isRenderingToScreen
]);
"use strict";
function isRenderingToScreen(renderTarget) {
    const resource = renderTarget.colorTexture.source.resource;
    return globalThis.HTMLCanvasElement && resource instanceof HTMLCanvasElement && document.body.contains(resource);
}
;
 //# sourceMappingURL=isRenderingToScreen.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/renderTarget/RenderTargetSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RenderTargetSystem",
    ()=>RenderTargetSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/matrix/Matrix.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/const.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$renderTarget$2f$calculateProjection$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gpu/renderTarget/calculateProjection.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$SystemRunner$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/system/SystemRunner.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$CanvasSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/CanvasSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/TextureSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$utils$2f$getCanvasTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/utils/getCanvasTexture.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$isRenderingToScreen$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/renderTarget/isRenderingToScreen.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$RenderTarget$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/renderTarget/RenderTarget.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
"use strict";
class RenderTargetSystem {
    constructor(renderer){
        /** This is the root viewport for the render pass*/ this.rootViewPort = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Rectangle"]();
        /** the current viewport that the gpu is using */ this.viewport = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Rectangle"]();
        /**
     * a runner that lets systems know if the active render target has changed.
     * Eg the Stencil System needs to know so it can manage the stencil buffer
     */ this.onRenderTargetChange = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$SystemRunner$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SystemRunner"]("onRenderTargetChange");
        /** the projection matrix that is used by the shaders based on the active render target and the viewport */ this.projectionMatrix = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$matrix$2f$Matrix$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Matrix"]();
        /** the default clear color for render targets */ this.defaultClearColor = [
            0,
            0,
            0,
            0
        ];
        /**
     * a hash that stores the render target for a given render surface. When you pass in a texture source,
     * a render target is created for it. This map stores and makes it easy to retrieve the render target
     */ this._renderSurfaceToRenderTargetHash = /* @__PURE__ */ new Map();
        /** A hash that stores a gpu render target for a given render target. */ this._gpuRenderTargetHash = /* @__PURE__ */ Object.create(null);
        /**
     * A stack that stores the render target and frame that is currently being rendered to.
     * When push is called, the current render target is stored in this stack.
     * When pop is called, the previous render target is restored.
     */ this._renderTargetStack = [];
        this._renderer = renderer;
        renderer.renderableGC.addManagedHash(this, "_gpuRenderTargetHash");
    }
    /** called when dev wants to finish a render pass */ finishRenderPass() {
        this.adaptor.finishRenderPass(this.renderTarget);
    }
    /**
   * called when the renderer starts to render a scene.
   * @param options
   * @param options.target - the render target to render to
   * @param options.clear - the clear mode to use. Can be true or a CLEAR number 'COLOR | DEPTH | STENCIL' 0b111
   * @param options.clearColor - the color to clear to
   * @param options.frame - the frame to render to
   */ renderStart({ target, clear, clearColor, frame }) {
        this._renderTargetStack.length = 0;
        this.push(target, clear, clearColor, frame);
        this.rootViewPort.copyFrom(this.viewport);
        this.rootRenderTarget = this.renderTarget;
        this.renderingToScreen = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$isRenderingToScreen$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["isRenderingToScreen"])(this.rootRenderTarget);
        this.adaptor.prerender?.(this.rootRenderTarget);
    }
    postrender() {
        this.adaptor.postrender?.(this.rootRenderTarget);
    }
    /**
   * Binding a render surface! This is the main function of the render target system.
   * It will take the RenderSurface (which can be a texture, canvas, or render target) and bind it to the renderer.
   * Once bound all draw calls will be rendered to the render surface.
   *
   * If a frame is not provide and the render surface is a texture, the frame of the texture will be used.
   * @param renderSurface - the render surface to bind
   * @param clear - the clear mode to use. Can be true or a CLEAR number 'COLOR | DEPTH | STENCIL' 0b111
   * @param clearColor - the color to clear to
   * @param frame - the frame to render to
   * @returns the render target that was bound
   */ bind(renderSurface, clear = true, clearColor, frame) {
        const renderTarget = this.getRenderTarget(renderSurface);
        const didChange = this.renderTarget !== renderTarget;
        this.renderTarget = renderTarget;
        this.renderSurface = renderSurface;
        const gpuRenderTarget = this.getGpuRenderTarget(renderTarget);
        if (renderTarget.pixelWidth !== gpuRenderTarget.width || renderTarget.pixelHeight !== gpuRenderTarget.height) {
            this.adaptor.resizeGpuRenderTarget(renderTarget);
            gpuRenderTarget.width = renderTarget.pixelWidth;
            gpuRenderTarget.height = renderTarget.pixelHeight;
        }
        const source = renderTarget.colorTexture;
        const viewport = this.viewport;
        const pixelWidth = source.pixelWidth;
        const pixelHeight = source.pixelHeight;
        if (!frame && renderSurface instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"]) {
            frame = renderSurface.frame;
        }
        if (frame) {
            const resolution = source._resolution;
            viewport.x = frame.x * resolution + 0.5 | 0;
            viewport.y = frame.y * resolution + 0.5 | 0;
            viewport.width = frame.width * resolution + 0.5 | 0;
            viewport.height = frame.height * resolution + 0.5 | 0;
        } else {
            viewport.x = 0;
            viewport.y = 0;
            viewport.width = pixelWidth;
            viewport.height = pixelHeight;
        }
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gpu$2f$renderTarget$2f$calculateProjection$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calculateProjection"])(this.projectionMatrix, 0, 0, viewport.width / source.resolution, viewport.height / source.resolution, !renderTarget.isRoot);
        this.adaptor.startRenderPass(renderTarget, clear, clearColor, viewport);
        if (didChange) {
            this.onRenderTargetChange.emit(renderTarget);
        }
        return renderTarget;
    }
    clear(target, clear = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLEAR"].ALL, clearColor) {
        if (!clear) return;
        if (target) {
            target = this.getRenderTarget(target);
        }
        this.adaptor.clear(target || this.renderTarget, clear, clearColor, this.viewport);
    }
    contextChange() {
        this._gpuRenderTargetHash = /* @__PURE__ */ Object.create(null);
    }
    /**
   * Push a render surface to the renderer. This will bind the render surface to the renderer,
   * @param renderSurface - the render surface to push
   * @param clear - the clear mode to use. Can be true or a CLEAR number 'COLOR | DEPTH | STENCIL' 0b111
   * @param clearColor - the color to clear to
   * @param frame - the frame to use when rendering to the render surface
   */ push(renderSurface, clear = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLEAR"].ALL, clearColor, frame) {
        const renderTarget = this.bind(renderSurface, clear, clearColor, frame);
        this._renderTargetStack.push({
            renderTarget,
            frame
        });
        return renderTarget;
    }
    /** Pops the current render target from the renderer and restores the previous render target. */ pop() {
        this._renderTargetStack.pop();
        const currentRenderTargetData = this._renderTargetStack[this._renderTargetStack.length - 1];
        this.bind(currentRenderTargetData.renderTarget, false, null, currentRenderTargetData.frame);
    }
    /**
   * Gets the render target from the provide render surface. Eg if its a texture,
   * it will return the render target for the texture.
   * If its a render target, it will return the same render target.
   * @param renderSurface - the render surface to get the render target for
   * @returns the render target for the render surface
   */ getRenderTarget(renderSurface) {
        if (renderSurface.isTexture) {
            renderSurface = renderSurface.source;
        }
        return this._renderSurfaceToRenderTargetHash.get(renderSurface) ?? this._initRenderTarget(renderSurface);
    }
    /**
   * Copies a render surface to another texture.
   *
   * NOTE:
   * for sourceRenderSurfaceTexture, The render target must be something that is written too by the renderer
   *
   * The following is not valid:
   * @example
   * const canvas = document.createElement('canvas')
   * canvas.width = 200;
   * canvas.height = 200;
   *
   * const ctx = canvas2.getContext('2d')!
   * ctx.fillStyle = 'red'
   * ctx.fillRect(0, 0, 200, 200);
   *
   * const texture = RenderTexture.create({
   *   width: 200,
   *   height: 200,
   * })
   * const renderTarget = renderer.renderTarget.getRenderTarget(canvas2);
   *
   * renderer.renderTarget.copyToTexture(renderTarget,texture, {x:0,y:0},{width:200,height:200},{x:0,y:0});
   *
   * The best way to copy a canvas is to create a texture from it. Then render with that.
   *
   * Parsing in a RenderTarget canvas context (with a 2d context)
   * @param sourceRenderSurfaceTexture - the render surface to copy from
   * @param destinationTexture - the texture to copy to
   * @param originSrc - the origin of the copy
   * @param originSrc.x - the x origin of the copy
   * @param originSrc.y - the y origin of the copy
   * @param size - the size of the copy
   * @param size.width - the width of the copy
   * @param size.height - the height of the copy
   * @param originDest - the destination origin (top left to paste from!)
   * @param originDest.x - the x origin of the paste
   * @param originDest.y - the y origin of the paste
   */ copyToTexture(sourceRenderSurfaceTexture, destinationTexture, originSrc, size, originDest) {
        if (originSrc.x < 0) {
            size.width += originSrc.x;
            originDest.x -= originSrc.x;
            originSrc.x = 0;
        }
        if (originSrc.y < 0) {
            size.height += originSrc.y;
            originDest.y -= originSrc.y;
            originSrc.y = 0;
        }
        const { pixelWidth, pixelHeight } = sourceRenderSurfaceTexture;
        size.width = Math.min(size.width, pixelWidth - originSrc.x);
        size.height = Math.min(size.height, pixelHeight - originSrc.y);
        return this.adaptor.copyToTexture(sourceRenderSurfaceTexture, destinationTexture, originSrc, size, originDest);
    }
    /**
   * ensures that we have a depth stencil buffer available to render to
   * This is used by the mask system to make sure we have a stencil buffer.
   */ ensureDepthStencil() {
        if (!this.renderTarget.stencil) {
            this.renderTarget.stencil = true;
            this.adaptor.startRenderPass(this.renderTarget, false, null, this.viewport);
        }
    }
    /** nukes the render target system */ destroy() {
        this._renderer = null;
        this._renderSurfaceToRenderTargetHash.forEach((renderTarget, key)=>{
            if (renderTarget !== key) {
                renderTarget.destroy();
            }
        });
        this._renderSurfaceToRenderTargetHash.clear();
        this._gpuRenderTargetHash = /* @__PURE__ */ Object.create(null);
    }
    _initRenderTarget(renderSurface) {
        let renderTarget = null;
        if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$CanvasSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasSource"].test(renderSurface)) {
            renderSurface = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$utils$2f$getCanvasTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getCanvasTexture"])(renderSurface).source;
        }
        if (renderSurface instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$RenderTarget$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderTarget"]) {
            renderTarget = renderSurface;
        } else if (renderSurface instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureSource"]) {
            renderTarget = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$RenderTarget$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderTarget"]({
                colorTextures: [
                    renderSurface
                ]
            });
            if (renderSurface.source instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$CanvasSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasSource"]) {
                renderTarget.isRoot = true;
            }
            renderSurface.once("destroy", ()=>{
                renderTarget.destroy();
                this._renderSurfaceToRenderTargetHash.delete(renderSurface);
                const gpuRenderTarget = this._gpuRenderTargetHash[renderTarget.uid];
                if (gpuRenderTarget) {
                    this._gpuRenderTargetHash[renderTarget.uid] = null;
                    this.adaptor.destroyGpuRenderTarget(gpuRenderTarget);
                }
            });
        }
        this._renderSurfaceToRenderTargetHash.set(renderSurface, renderTarget);
        return renderTarget;
    }
    getGpuRenderTarget(renderTarget) {
        return this._gpuRenderTargetHash[renderTarget.uid] || (this._gpuRenderTargetHash[renderTarget.uid] = this.adaptor.initGpuRenderTarget(renderTarget));
    }
    resetState() {
        this.renderTarget = null;
        this.renderSurface = null;
    }
}
;
 //# sourceMappingURL=RenderTargetSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/GlRenderTarget.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlRenderTarget",
    ()=>GlRenderTarget
]);
"use strict";
class GlRenderTarget {
    constructor(){
        this.width = -1;
        this.height = -1;
        this.msaa = false;
        this.msaaRenderBuffer = [];
    }
}
;
 //# sourceMappingURL=GlRenderTarget.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/renderTarget/GlRenderTargetAdaptor.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlRenderTargetAdaptor",
    ()=>GlRenderTargetAdaptor
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/maths/shapes/Rectangle.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$CanvasSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/CanvasSource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/const.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$GlRenderTarget$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/GlRenderTarget.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
"use strict";
class GlRenderTargetAdaptor {
    constructor(){
        this._clearColorCache = [
            0,
            0,
            0,
            0
        ];
        this._viewPortCache = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Rectangle"]();
    }
    init(renderer, renderTargetSystem) {
        this._renderer = renderer;
        this._renderTargetSystem = renderTargetSystem;
        renderer.runners.contextChange.add(this);
    }
    contextChange() {
        this._clearColorCache = [
            0,
            0,
            0,
            0
        ];
        this._viewPortCache = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$maths$2f$shapes$2f$Rectangle$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Rectangle"]();
    }
    copyToTexture(sourceRenderSurfaceTexture, destinationTexture, originSrc, size, originDest) {
        const renderTargetSystem = this._renderTargetSystem;
        const renderer = this._renderer;
        const glRenderTarget = renderTargetSystem.getGpuRenderTarget(sourceRenderSurfaceTexture);
        const gl = renderer.gl;
        this.finishRenderPass(sourceRenderSurfaceTexture);
        gl.bindFramebuffer(gl.FRAMEBUFFER, glRenderTarget.resolveTargetFramebuffer);
        renderer.texture.bind(destinationTexture, 0);
        gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, originDest.x, originDest.y, originSrc.x, originSrc.y, size.width, size.height);
        return destinationTexture;
    }
    startRenderPass(renderTarget, clear = true, clearColor, viewport) {
        const renderTargetSystem = this._renderTargetSystem;
        const source = renderTarget.colorTexture;
        const gpuRenderTarget = renderTargetSystem.getGpuRenderTarget(renderTarget);
        let viewPortY = viewport.y;
        if (renderTarget.isRoot) {
            viewPortY = source.pixelHeight - viewport.height;
        }
        renderTarget.colorTextures.forEach((texture)=>{
            this._renderer.texture.unbind(texture);
        });
        const gl = this._renderer.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, gpuRenderTarget.framebuffer);
        const viewPortCache = this._viewPortCache;
        if (viewPortCache.x !== viewport.x || viewPortCache.y !== viewPortY || viewPortCache.width !== viewport.width || viewPortCache.height !== viewport.height) {
            viewPortCache.x = viewport.x;
            viewPortCache.y = viewPortY;
            viewPortCache.width = viewport.width;
            viewPortCache.height = viewport.height;
            gl.viewport(viewport.x, viewPortY, viewport.width, viewport.height);
        }
        if (!gpuRenderTarget.depthStencilRenderBuffer && (renderTarget.stencil || renderTarget.depth)) {
            this._initStencil(gpuRenderTarget);
        }
        this.clear(renderTarget, clear, clearColor);
    }
    finishRenderPass(renderTarget) {
        const renderTargetSystem = this._renderTargetSystem;
        const glRenderTarget = renderTargetSystem.getGpuRenderTarget(renderTarget);
        if (!glRenderTarget.msaa) return;
        const gl = this._renderer.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, glRenderTarget.resolveTargetFramebuffer);
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, glRenderTarget.framebuffer);
        gl.blitFramebuffer(0, 0, glRenderTarget.width, glRenderTarget.height, 0, 0, glRenderTarget.width, glRenderTarget.height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
        gl.bindFramebuffer(gl.FRAMEBUFFER, glRenderTarget.framebuffer);
    }
    initGpuRenderTarget(renderTarget) {
        const renderer = this._renderer;
        const gl = renderer.gl;
        const glRenderTarget = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$GlRenderTarget$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlRenderTarget"]();
        const colorTexture = renderTarget.colorTexture;
        if (colorTexture instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$CanvasSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasSource"]) {
            this._renderer.context.ensureCanvasSize(renderTarget.colorTexture.resource);
            glRenderTarget.framebuffer = null;
            return glRenderTarget;
        }
        this._initColor(renderTarget, glRenderTarget);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return glRenderTarget;
    }
    destroyGpuRenderTarget(gpuRenderTarget) {
        const gl = this._renderer.gl;
        if (gpuRenderTarget.framebuffer) {
            gl.deleteFramebuffer(gpuRenderTarget.framebuffer);
            gpuRenderTarget.framebuffer = null;
        }
        if (gpuRenderTarget.resolveTargetFramebuffer) {
            gl.deleteFramebuffer(gpuRenderTarget.resolveTargetFramebuffer);
            gpuRenderTarget.resolveTargetFramebuffer = null;
        }
        if (gpuRenderTarget.depthStencilRenderBuffer) {
            gl.deleteRenderbuffer(gpuRenderTarget.depthStencilRenderBuffer);
            gpuRenderTarget.depthStencilRenderBuffer = null;
        }
        gpuRenderTarget.msaaRenderBuffer.forEach((renderBuffer)=>{
            gl.deleteRenderbuffer(renderBuffer);
        });
        gpuRenderTarget.msaaRenderBuffer = null;
    }
    clear(_renderTarget, clear, clearColor) {
        if (!clear) return;
        const renderTargetSystem = this._renderTargetSystem;
        if (typeof clear === "boolean") {
            clear = clear ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLEAR"].ALL : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLEAR"].NONE;
        }
        const gl = this._renderer.gl;
        if (clear & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CLEAR"].COLOR) {
            clearColor ?? (clearColor = renderTargetSystem.defaultClearColor);
            const clearColorCache = this._clearColorCache;
            const clearColorArray = clearColor;
            if (clearColorCache[0] !== clearColorArray[0] || clearColorCache[1] !== clearColorArray[1] || clearColorCache[2] !== clearColorArray[2] || clearColorCache[3] !== clearColorArray[3]) {
                clearColorCache[0] = clearColorArray[0];
                clearColorCache[1] = clearColorArray[1];
                clearColorCache[2] = clearColorArray[2];
                clearColorCache[3] = clearColorArray[3];
                gl.clearColor(clearColorArray[0], clearColorArray[1], clearColorArray[2], clearColorArray[3]);
            }
        }
        gl.clear(clear);
    }
    resizeGpuRenderTarget(renderTarget) {
        if (renderTarget.isRoot) return;
        const renderTargetSystem = this._renderTargetSystem;
        const glRenderTarget = renderTargetSystem.getGpuRenderTarget(renderTarget);
        this._resizeColor(renderTarget, glRenderTarget);
        if (renderTarget.stencil || renderTarget.depth) {
            this._resizeStencil(glRenderTarget);
        }
    }
    _initColor(renderTarget, glRenderTarget) {
        const renderer = this._renderer;
        const gl = renderer.gl;
        const resolveTargetFramebuffer = gl.createFramebuffer();
        glRenderTarget.resolveTargetFramebuffer = resolveTargetFramebuffer;
        gl.bindFramebuffer(gl.FRAMEBUFFER, resolveTargetFramebuffer);
        glRenderTarget.width = renderTarget.colorTexture.source.pixelWidth;
        glRenderTarget.height = renderTarget.colorTexture.source.pixelHeight;
        renderTarget.colorTextures.forEach((colorTexture, i)=>{
            const source = colorTexture.source;
            if (source.antialias) {
                if (renderer.context.supports.msaa) {
                    glRenderTarget.msaa = true;
                } else {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])("[RenderTexture] Antialiasing on textures is not supported in WebGL1");
                }
            }
            renderer.texture.bindSource(source, 0);
            const glSource = renderer.texture.getGlSource(source);
            const glTexture = glSource.texture;
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, 3553, // texture.target,
            glTexture, 0);
        });
        if (glRenderTarget.msaa) {
            const viewFramebuffer = gl.createFramebuffer();
            glRenderTarget.framebuffer = viewFramebuffer;
            gl.bindFramebuffer(gl.FRAMEBUFFER, viewFramebuffer);
            renderTarget.colorTextures.forEach((_, i)=>{
                const msaaRenderBuffer = gl.createRenderbuffer();
                glRenderTarget.msaaRenderBuffer[i] = msaaRenderBuffer;
            });
        } else {
            glRenderTarget.framebuffer = resolveTargetFramebuffer;
        }
        this._resizeColor(renderTarget, glRenderTarget);
    }
    _resizeColor(renderTarget, glRenderTarget) {
        const source = renderTarget.colorTexture.source;
        glRenderTarget.width = source.pixelWidth;
        glRenderTarget.height = source.pixelHeight;
        renderTarget.colorTextures.forEach((colorTexture, i)=>{
            if (i === 0) return;
            colorTexture.source.resize(source.width, source.height, source._resolution);
        });
        if (glRenderTarget.msaa) {
            const renderer = this._renderer;
            const gl = renderer.gl;
            const viewFramebuffer = glRenderTarget.framebuffer;
            gl.bindFramebuffer(gl.FRAMEBUFFER, viewFramebuffer);
            renderTarget.colorTextures.forEach((colorTexture, i)=>{
                const source2 = colorTexture.source;
                renderer.texture.bindSource(source2, 0);
                const glSource = renderer.texture.getGlSource(source2);
                const glInternalFormat = glSource.internalFormat;
                const msaaRenderBuffer = glRenderTarget.msaaRenderBuffer[i];
                gl.bindRenderbuffer(gl.RENDERBUFFER, msaaRenderBuffer);
                gl.renderbufferStorageMultisample(gl.RENDERBUFFER, 4, glInternalFormat, source2.pixelWidth, source2.pixelHeight);
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.RENDERBUFFER, msaaRenderBuffer);
            });
        }
    }
    _initStencil(glRenderTarget) {
        if (glRenderTarget.framebuffer === null) return;
        const gl = this._renderer.gl;
        const depthStencilRenderBuffer = gl.createRenderbuffer();
        glRenderTarget.depthStencilRenderBuffer = depthStencilRenderBuffer;
        gl.bindRenderbuffer(gl.RENDERBUFFER, depthStencilRenderBuffer);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, depthStencilRenderBuffer);
        this._resizeStencil(glRenderTarget);
    }
    _resizeStencil(glRenderTarget) {
        const gl = this._renderer.gl;
        gl.bindRenderbuffer(gl.RENDERBUFFER, glRenderTarget.depthStencilRenderBuffer);
        if (glRenderTarget.msaa) {
            gl.renderbufferStorageMultisample(gl.RENDERBUFFER, 4, gl.DEPTH24_STENCIL8, glRenderTarget.width, glRenderTarget.height);
        } else {
            gl.renderbufferStorage(gl.RENDERBUFFER, this._renderer.context.webGLVersion === 2 ? gl.DEPTH24_STENCIL8 : gl.DEPTH_STENCIL, glRenderTarget.width, glRenderTarget.height);
        }
    }
    prerender(renderTarget) {
        const resource = renderTarget.colorTexture.resource;
        if (this._renderer.context.multiView && __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$CanvasSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasSource"].test(resource)) {
            this._renderer.context.ensureCanvasSize(resource);
        }
    }
    postrender(renderTarget) {
        if (!this._renderer.context.multiView) return;
        if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$CanvasSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["CanvasSource"].test(renderTarget.colorTexture.resource)) {
            const contextCanvas = this._renderer.context.canvas;
            const canvasSource = renderTarget.colorTexture;
            canvasSource.context2D.drawImage(contextCanvas, 0, canvasSource.pixelHeight - contextCanvas.height);
        }
    }
}
;
 //# sourceMappingURL=GlRenderTargetAdaptor.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/renderTarget/GlRenderTargetSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlRenderTargetSystem",
    ()=>GlRenderTargetSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$RenderTargetSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/renderTarget/RenderTargetSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$renderTarget$2f$GlRenderTargetAdaptor$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/renderTarget/GlRenderTargetAdaptor.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
class GlRenderTargetSystem extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$renderTarget$2f$RenderTargetSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RenderTargetSystem"] {
    constructor(renderer){
        super(renderer);
        this.adaptor = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$renderTarget$2f$GlRenderTargetAdaptor$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlRenderTargetAdaptor"]();
        this.adaptor.init(renderer, this);
    }
}
/** @ignore */ GlRenderTargetSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem
    ],
    name: "renderTarget"
};
;
 //# sourceMappingURL=GlRenderTargetSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/BufferResource.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BufferResource",
    ()=>BufferResource
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/eventemitter3@5.0.1/node_modules/eventemitter3/index.mjs [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/data/uid.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
class BufferResource extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$eventemitter3$40$5$2e$0$2e$1$2f$node_modules$2f$eventemitter3$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"] {
    /**
   * Create a new Buffer Resource.
   * @param options - The options for the buffer resource
   * @param options.buffer - The underlying buffer that this resource is using
   * @param options.offset - The offset of the buffer this resource is using.
   * If not provided, then it will use the offset of the buffer.
   * @param options.size - The size of the buffer this resource is using.
   * If not provided, then it will use the size of the buffer.
   */ constructor({ buffer, offset, size }){
        super();
        /**
     * emits when the underlying buffer has changed shape (i.e. resized)
     * letting the renderer know that it needs to discard the old buffer on the GPU and create a new one
     * @event change
     */ /** a unique id for this uniform group used through the renderer */ this.uid = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uid"])("buffer");
        /**
     * a resource type, used to identify how to handle it when its in a bind group / shader resource
     * @internal
     */ this._resourceType = "bufferResource";
        /**
     * used internally to know if a uniform group was used in the last render pass
     * @internal
     */ this._touched = 0;
        /**
     * the resource id used internally by the renderer to build bind group keys
     * @internal
     */ this._resourceId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uid"])("resource");
        /**
     * A cheeky hint to the GL renderer to let it know this is a BufferResource
     * @internal
     */ this._bufferResource = true;
        /**
     * Has the Buffer resource been destroyed?
     * @readonly
     */ this.destroyed = false;
        this.buffer = buffer;
        this.offset = offset | 0;
        this.size = size;
        this.buffer.on("change", this.onBufferChange, this);
    }
    onBufferChange() {
        this._resourceId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$data$2f$uid$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uid"])("resource");
        this.emit("change", this);
    }
    /**
   * Destroys this resource. Make sure the underlying buffer is not used anywhere else
   * if you want to destroy it as well, or code will explode
   * @param destroyBuffer - Should the underlying buffer be destroyed as well?
   */ destroy(destroyBuffer = false) {
        this.destroyed = true;
        if (destroyBuffer) {
            this.buffer.destroy();
        }
        this.emit("change", this);
        this.buffer = null;
    }
}
;
 //# sourceMappingURL=BufferResource.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GenerateShaderSyncCode.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateShaderSyncCode",
    ()=>generateShaderSyncCode
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$BufferResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/BufferResource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UniformGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/sources/TextureSource.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
function generateShaderSyncCode(shader, shaderSystem) {
    const funcFragments = [];
    const headerFragments = [
        `
        var g = s.groups;
        var sS = r.shader;
        var p = s.glProgram;
        var ugS = r.uniformGroup;
        var resources;
    `
    ];
    let addedTextreSystem = false;
    let textureCount = 0;
    const programData = shaderSystem._getProgramData(shader.glProgram);
    for(const i in shader.groups){
        const group = shader.groups[i];
        funcFragments.push(`
            resources = g[${i}].resources;
        `);
        for(const j in group.resources){
            const resource = group.resources[j];
            if (resource instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UniformGroup"]) {
                if (resource.ubo) {
                    const resName = shader._uniformBindMap[i][Number(j)];
                    funcFragments.push(`
                        sS.bindUniformBlock(
                            resources[${j}],
                            '${resName}',
                            ${shader.glProgram._uniformBlockData[resName].index}
                        );
                    `);
                } else {
                    funcFragments.push(`
                        ugS.updateUniformGroup(resources[${j}], p, sD);
                    `);
                }
            } else if (resource instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$BufferResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferResource"]) {
                const resName = shader._uniformBindMap[i][Number(j)];
                funcFragments.push(`
                    sS.bindUniformBlock(
                        resources[${j}],
                        '${resName}',
                        ${shader.glProgram._uniformBlockData[resName].index}
                    );
                `);
            } else if (resource instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$sources$2f$TextureSource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["TextureSource"]) {
                const uniformName = shader._uniformBindMap[i][j];
                const uniformData = programData.uniformData[uniformName];
                if (uniformData) {
                    if (!addedTextreSystem) {
                        addedTextreSystem = true;
                        headerFragments.push(`
                        var tS = r.texture;
                        `);
                    }
                    shaderSystem._gl.uniform1i(uniformData.location, textureCount);
                    funcFragments.push(`
                        tS.bind(resources[${j}], ${textureCount});
                    `);
                    textureCount++;
                }
            }
        }
    }
    const functionSource = [
        ...headerFragments,
        ...funcFragments
    ].join("\n");
    return new Function("r", "s", "sD", functionSource);
}
;
 //# sourceMappingURL=GenerateShaderSyncCode.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlProgramData.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlProgramData",
    ()=>GlProgramData,
    "IGLUniformData",
    ()=>IGLUniformData
]);
"use strict";
class IGLUniformData {
}
class GlProgramData {
    /**
   * Makes a new Pixi program.
   * @param program - webgl program
   * @param uniformData - uniforms
   */ constructor(program, uniformData){
        this.program = program;
        this.uniformData = uniformData;
        this.uniformGroups = {};
        this.uniformDirtyGroups = {};
        this.uniformBlockBindings = {};
    }
    /** Destroys this program. */ destroy() {
        this.uniformData = null;
        this.uniformGroups = null;
        this.uniformDirtyGroups = null;
        this.uniformBlockBindings = null;
        this.program = null;
    }
}
;
 //# sourceMappingURL=GlProgramData.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/compileShader.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "compileShader",
    ()=>compileShader
]);
"use strict";
function compileShader(gl, type, src) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    return shader;
}
;
 //# sourceMappingURL=compileShader.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/defaultValue.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "defaultValue",
    ()=>defaultValue
]);
"use strict";
function booleanArray(size) {
    const array = new Array(size);
    for(let i = 0; i < array.length; i++){
        array[i] = false;
    }
    return array;
}
function defaultValue(type, size) {
    switch(type){
        case "float":
            return 0;
        case "vec2":
            return new Float32Array(2 * size);
        case "vec3":
            return new Float32Array(3 * size);
        case "vec4":
            return new Float32Array(4 * size);
        case "int":
        case "uint":
        case "sampler2D":
        case "sampler2DArray":
            return 0;
        case "ivec2":
            return new Int32Array(2 * size);
        case "ivec3":
            return new Int32Array(3 * size);
        case "ivec4":
            return new Int32Array(4 * size);
        case "uvec2":
            return new Uint32Array(2 * size);
        case "uvec3":
            return new Uint32Array(3 * size);
        case "uvec4":
            return new Uint32Array(4 * size);
        case "bool":
            return false;
        case "bvec2":
            return booleanArray(2 * size);
        case "bvec3":
            return booleanArray(3 * size);
        case "bvec4":
            return booleanArray(4 * size);
        case "mat2":
            return new Float32Array([
                1,
                0,
                0,
                1
            ]);
        case "mat3":
            return new Float32Array([
                1,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                1
            ]);
        case "mat4":
            return new Float32Array([
                1,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                1
            ]);
    }
    return null;
}
;
 //# sourceMappingURL=defaultValue.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/mapType.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mapGlToVertexFormat",
    ()=>mapGlToVertexFormat,
    "mapType",
    ()=>mapType
]);
"use strict";
let GL_TABLE = null;
const GL_TO_GLSL_TYPES = {
    FLOAT: "float",
    FLOAT_VEC2: "vec2",
    FLOAT_VEC3: "vec3",
    FLOAT_VEC4: "vec4",
    INT: "int",
    INT_VEC2: "ivec2",
    INT_VEC3: "ivec3",
    INT_VEC4: "ivec4",
    UNSIGNED_INT: "uint",
    UNSIGNED_INT_VEC2: "uvec2",
    UNSIGNED_INT_VEC3: "uvec3",
    UNSIGNED_INT_VEC4: "uvec4",
    BOOL: "bool",
    BOOL_VEC2: "bvec2",
    BOOL_VEC3: "bvec3",
    BOOL_VEC4: "bvec4",
    FLOAT_MAT2: "mat2",
    FLOAT_MAT3: "mat3",
    FLOAT_MAT4: "mat4",
    SAMPLER_2D: "sampler2D",
    INT_SAMPLER_2D: "sampler2D",
    UNSIGNED_INT_SAMPLER_2D: "sampler2D",
    SAMPLER_CUBE: "samplerCube",
    INT_SAMPLER_CUBE: "samplerCube",
    UNSIGNED_INT_SAMPLER_CUBE: "samplerCube",
    SAMPLER_2D_ARRAY: "sampler2DArray",
    INT_SAMPLER_2D_ARRAY: "sampler2DArray",
    UNSIGNED_INT_SAMPLER_2D_ARRAY: "sampler2DArray"
};
const GLSL_TO_VERTEX_TYPES = {
    float: "float32",
    vec2: "float32x2",
    vec3: "float32x3",
    vec4: "float32x4",
    int: "sint32",
    ivec2: "sint32x2",
    ivec3: "sint32x3",
    ivec4: "sint32x4",
    uint: "uint32",
    uvec2: "uint32x2",
    uvec3: "uint32x3",
    uvec4: "uint32x4",
    bool: "uint32",
    bvec2: "uint32x2",
    bvec3: "uint32x3",
    bvec4: "uint32x4"
};
function mapType(gl, type) {
    if (!GL_TABLE) {
        const typeNames = Object.keys(GL_TO_GLSL_TYPES);
        GL_TABLE = {};
        for(let i = 0; i < typeNames.length; ++i){
            const tn = typeNames[i];
            GL_TABLE[gl[tn]] = GL_TO_GLSL_TYPES[tn];
        }
    }
    return GL_TABLE[type];
}
function mapGlToVertexFormat(gl, type) {
    const typeValue = mapType(gl, type);
    return GLSL_TO_VERTEX_TYPES[typeValue] || "float32";
}
;
 //# sourceMappingURL=mapType.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/extractAttributesFromGlProgram.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "extractAttributesFromGlProgram",
    ()=>extractAttributesFromGlProgram
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$getAttributeInfoFromFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/geometry/utils/getAttributeInfoFromFormat.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$mapType$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/mapType.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
function extractAttributesFromGlProgram(program, gl, sortAttributes = false) {
    const attributes = {};
    const totalAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    for(let i = 0; i < totalAttributes; i++){
        const attribData = gl.getActiveAttrib(program, i);
        if (attribData.name.startsWith("gl_")) {
            continue;
        }
        const format = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$mapType$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mapGlToVertexFormat"])(gl, attribData.type);
        attributes[attribData.name] = {
            location: 0,
            // set further down..
            format,
            stride: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$geometry$2f$utils$2f$getAttributeInfoFromFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getAttributeInfoFromFormat"])(format).stride,
            offset: 0,
            instance: false,
            start: 0
        };
    }
    const keys = Object.keys(attributes);
    if (sortAttributes) {
        keys.sort((a, b)=>a > b ? 1 : -1);
        for(let i = 0; i < keys.length; i++){
            attributes[keys[i]].location = i;
            gl.bindAttribLocation(program, i, keys[i]);
        }
        gl.linkProgram(program);
    } else {
        for(let i = 0; i < keys.length; i++){
            attributes[keys[i]].location = gl.getAttribLocation(program, keys[i]);
        }
    }
    return attributes;
}
;
 //# sourceMappingURL=extractAttributesFromGlProgram.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/getUboData.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getUboData",
    ()=>getUboData
]);
"use strict";
function getUboData(program, gl) {
    if (!gl.ACTIVE_UNIFORM_BLOCKS) return {};
    const uniformBlocks = {};
    const totalUniformsBlocks = gl.getProgramParameter(program, gl.ACTIVE_UNIFORM_BLOCKS);
    for(let i = 0; i < totalUniformsBlocks; i++){
        const name = gl.getActiveUniformBlockName(program, i);
        const uniformBlockIndex = gl.getUniformBlockIndex(program, name);
        const size = gl.getActiveUniformBlockParameter(program, i, gl.UNIFORM_BLOCK_DATA_SIZE);
        uniformBlocks[name] = {
            name,
            index: uniformBlockIndex,
            size
        };
    }
    return uniformBlocks;
}
;
 //# sourceMappingURL=getUboData.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/getUniformData.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getUniformData",
    ()=>getUniformData
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$defaultValue$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/defaultValue.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$mapType$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/mapType.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
function getUniformData(program, gl) {
    const uniforms = {};
    const totalUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for(let i = 0; i < totalUniforms; i++){
        const uniformData = gl.getActiveUniform(program, i);
        const name = uniformData.name.replace(/\[.*?\]$/, "");
        const isArray = !!uniformData.name.match(/\[.*?\]$/);
        const type = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$mapType$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mapType"])(gl, uniformData.type);
        uniforms[name] = {
            name,
            index: i,
            type,
            size: uniformData.size,
            isArray,
            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$defaultValue$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["defaultValue"])(type, uniformData.size)
        };
    }
    return uniforms;
}
;
 //# sourceMappingURL=getUniformData.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/logProgramError.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "logProgramError",
    ()=>logProgramError
]);
"use strict";
function logPrettyShaderError(gl, shader) {
    const shaderSrc = gl.getShaderSource(shader).split("\n").map((line, index)=>`${index}: ${line}`);
    const shaderLog = gl.getShaderInfoLog(shader);
    const splitShader = shaderLog.split("\n");
    const dedupe = {};
    const lineNumbers = splitShader.map((line)=>parseFloat(line.replace(/^ERROR\: 0\:([\d]+)\:.*$/, "$1"))).filter((n)=>{
        if (n && !dedupe[n]) {
            dedupe[n] = true;
            return true;
        }
        return false;
    });
    const logArgs = [
        ""
    ];
    lineNumbers.forEach((number)=>{
        shaderSrc[number - 1] = `%c${shaderSrc[number - 1]}%c`;
        logArgs.push("background: #FF0000; color:#FFFFFF; font-size: 10px", "font-size: 10px");
    });
    const fragmentSourceToLog = shaderSrc.join("\n");
    logArgs[0] = fragmentSourceToLog;
    console.error(shaderLog);
    console.groupCollapsed("click to view full shader code");
    console.warn(...logArgs);
    console.groupEnd();
}
function logProgramError(gl, program, vertexShader, fragmentShader) {
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            logPrettyShaderError(gl, vertexShader);
        }
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            logPrettyShaderError(gl, fragmentShader);
        }
        console.error("PixiJS Error: Could not initialize shader.");
        if (gl.getProgramInfoLog(program) !== "") {
            console.warn("PixiJS Warning: gl.getProgramInfoLog()", gl.getProgramInfoLog(program));
        }
    }
}
;
 //# sourceMappingURL=logProgramError.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/generateProgram.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateProgram",
    ()=>generateProgram
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/utils/logging/warn.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlProgramData$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlProgramData.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$compileShader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/compileShader.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$defaultValue$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/defaultValue.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$extractAttributesFromGlProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/extractAttributesFromGlProgram.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$getUboData$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/getUboData.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$getUniformData$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/getUniformData.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$logProgramError$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/logProgramError.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
"use strict";
function generateProgram(gl, program) {
    const glVertShader = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$compileShader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["compileShader"])(gl, gl.VERTEX_SHADER, program.vertex);
    const glFragShader = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$compileShader$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["compileShader"])(gl, gl.FRAGMENT_SHADER, program.fragment);
    const webGLProgram = gl.createProgram();
    gl.attachShader(webGLProgram, glVertShader);
    gl.attachShader(webGLProgram, glFragShader);
    const transformFeedbackVaryings = program.transformFeedbackVaryings;
    if (transformFeedbackVaryings) {
        if (typeof gl.transformFeedbackVaryings !== "function") {
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$utils$2f$logging$2f$warn$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["warn"])(`TransformFeedback is not supported but TransformFeedbackVaryings are given.`);
        } else {
            gl.transformFeedbackVaryings(webGLProgram, transformFeedbackVaryings.names, transformFeedbackVaryings.bufferMode === "separate" ? gl.SEPARATE_ATTRIBS : gl.INTERLEAVED_ATTRIBS);
        }
    }
    gl.linkProgram(webGLProgram);
    if (!gl.getProgramParameter(webGLProgram, gl.LINK_STATUS)) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$logProgramError$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["logProgramError"])(gl, webGLProgram, glVertShader, glFragShader);
    }
    program._attributeData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$extractAttributesFromGlProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extractAttributesFromGlProgram"])(webGLProgram, gl, !/^[ \t]*#[ \t]*version[ \t]+300[ \t]+es[ \t]*$/m.test(program.vertex));
    program._uniformData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$getUniformData$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUniformData"])(webGLProgram, gl);
    program._uniformBlockData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$getUboData$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getUboData"])(webGLProgram, gl);
    gl.deleteShader(glVertShader);
    gl.deleteShader(glFragShader);
    const uniformData = {};
    for(const i in program._uniformData){
        const data = program._uniformData[i];
        uniformData[i] = {
            location: gl.getUniformLocation(webGLProgram, i),
            value: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$defaultValue$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["defaultValue"])(data.type, data.size)
        };
    }
    const glProgram = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlProgramData$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlProgramData"](webGLProgram, uniformData);
    return glProgram;
}
;
 //# sourceMappingURL=generateProgram.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlShaderSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlShaderSystem",
    ()=>GlShaderSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GenerateShaderSyncCode$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GenerateShaderSyncCode.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$generateProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/program/generateProgram.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
const defaultSyncData = {
    textureCount: 0,
    blockIndex: 0
};
class GlShaderSystem {
    constructor(renderer){
        /** @internal */ this._activeProgram = null;
        this._programDataHash = /* @__PURE__ */ Object.create(null);
        this._shaderSyncFunctions = /* @__PURE__ */ Object.create(null);
        this._renderer = renderer;
        this._renderer.renderableGC.addManagedHash(this, "_programDataHash");
    }
    contextChange(gl) {
        this._gl = gl;
        this._programDataHash = /* @__PURE__ */ Object.create(null);
        this._shaderSyncFunctions = /* @__PURE__ */ Object.create(null);
        this._activeProgram = null;
    }
    /**
   * Changes the current shader to the one given in parameter.
   * @param shader - the new shader
   * @param skipSync - false if the shader should automatically sync its uniforms.
   * @returns the glProgram that belongs to the shader.
   */ bind(shader, skipSync) {
        this._setProgram(shader.glProgram);
        if (skipSync) return;
        defaultSyncData.textureCount = 0;
        defaultSyncData.blockIndex = 0;
        let syncFunction = this._shaderSyncFunctions[shader.glProgram._key];
        if (!syncFunction) {
            syncFunction = this._shaderSyncFunctions[shader.glProgram._key] = this._generateShaderSync(shader, this);
        }
        this._renderer.buffer.nextBindBase(!!shader.glProgram.transformFeedbackVaryings);
        syncFunction(this._renderer, shader, defaultSyncData);
    }
    /**
   * Updates the uniform group.
   * @param uniformGroup - the uniform group to update
   */ updateUniformGroup(uniformGroup) {
        this._renderer.uniformGroup.updateUniformGroup(uniformGroup, this._activeProgram, defaultSyncData);
    }
    /**
   * Binds a uniform block to the shader.
   * @param uniformGroup - the uniform group to bind
   * @param name - the name of the uniform block
   * @param index - the index of the uniform block
   */ bindUniformBlock(uniformGroup, name, index = 0) {
        const bufferSystem = this._renderer.buffer;
        const programData = this._getProgramData(this._activeProgram);
        const isBufferResource = uniformGroup._bufferResource;
        if (!isBufferResource) {
            this._renderer.ubo.updateUniformGroup(uniformGroup);
        }
        const buffer = uniformGroup.buffer;
        const glBuffer = bufferSystem.updateBuffer(buffer);
        const boundLocation = bufferSystem.freeLocationForBufferBase(glBuffer);
        if (isBufferResource) {
            const { offset, size } = uniformGroup;
            if (offset === 0 && size === buffer.data.byteLength) {
                bufferSystem.bindBufferBase(glBuffer, boundLocation);
            } else {
                bufferSystem.bindBufferRange(glBuffer, boundLocation, offset);
            }
        } else if (bufferSystem.getLastBindBaseLocation(glBuffer) !== boundLocation) {
            bufferSystem.bindBufferBase(glBuffer, boundLocation);
        }
        const uniformBlockIndex = this._activeProgram._uniformBlockData[name].index;
        if (programData.uniformBlockBindings[index] === boundLocation) return;
        programData.uniformBlockBindings[index] = boundLocation;
        this._renderer.gl.uniformBlockBinding(programData.program, uniformBlockIndex, boundLocation);
    }
    _setProgram(program) {
        if (this._activeProgram === program) return;
        this._activeProgram = program;
        const programData = this._getProgramData(program);
        this._gl.useProgram(programData.program);
    }
    /**
   * @param program - the program to get the data for
   * @internal
   */ _getProgramData(program) {
        return this._programDataHash[program._key] || this._createProgramData(program);
    }
    _createProgramData(program) {
        const key = program._key;
        this._programDataHash[key] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$program$2f$generateProgram$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateProgram"])(this._gl, program);
        return this._programDataHash[key];
    }
    destroy() {
        for (const key of Object.keys(this._programDataHash)){
            const programData = this._programDataHash[key];
            programData.destroy();
            this._programDataHash[key] = null;
        }
        this._programDataHash = null;
        this._shaderSyncFunctions = null;
        this._activeProgram = null;
        this._renderer = null;
        this._gl = null;
    }
    /**
   * Creates a function that can be executed that will sync the shader as efficiently as possible.
   * Overridden by the unsafe eval package if you don't want eval used in your project.
   * @param shader - the shader to generate the sync function for
   * @param shaderSystem - the shader system to use
   * @returns - the generated sync function
   * @ignore
   */ _generateShaderSync(shader, shaderSystem) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GenerateShaderSyncCode$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateShaderSyncCode"])(shader, shaderSystem);
    }
    resetState() {
        this._activeProgram = null;
    }
}
/** @ignore */ GlShaderSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem
    ],
    name: "shader"
};
;
 //# sourceMappingURL=GlShaderSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/generateUniformsSyncTypes.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "UNIFORM_TO_ARRAY_SETTERS",
    ()=>UNIFORM_TO_ARRAY_SETTERS,
    "UNIFORM_TO_SINGLE_SETTERS",
    ()=>UNIFORM_TO_SINGLE_SETTERS
]);
"use strict";
const UNIFORM_TO_SINGLE_SETTERS = {
    f32: `if (cv !== v) {
            cu.value = v;
            gl.uniform1f(location, v);
        }`,
    "vec2<f32>": `if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2f(location, v[0], v[1]);
        }`,
    "vec3<f32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3f(location, v[0], v[1], v[2]);
        }`,
    "vec4<f32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4f(location, v[0], v[1], v[2], v[3]);
        }`,
    i32: `if (cv !== v) {
            cu.value = v;
            gl.uniform1i(location, v);
        }`,
    "vec2<i32>": `if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2i(location, v[0], v[1]);
        }`,
    "vec3<i32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3i(location, v[0], v[1], v[2]);
        }`,
    "vec4<i32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4i(location, v[0], v[1], v[2], v[3]);
        }`,
    u32: `if (cv !== v) {
            cu.value = v;
            gl.uniform1ui(location, v);
        }`,
    "vec2<u32>": `if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2ui(location, v[0], v[1]);
        }`,
    "vec3<u32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3ui(location, v[0], v[1], v[2]);
        }`,
    "vec4<u32>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4ui(location, v[0], v[1], v[2], v[3]);
        }`,
    bool: `if (cv !== v) {
            cu.value = v;
            gl.uniform1i(location, v);
        }`,
    "vec2<bool>": `if (cv[0] !== v[0] || cv[1] !== v[1]) {
            cv[0] = v[0];
            cv[1] = v[1];
            gl.uniform2i(location, v[0], v[1]);
        }`,
    "vec3<bool>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            gl.uniform3i(location, v[0], v[1], v[2]);
        }`,
    "vec4<bool>": `if (cv[0] !== v[0] || cv[1] !== v[1] || cv[2] !== v[2] || cv[3] !== v[3]) {
            cv[0] = v[0];
            cv[1] = v[1];
            cv[2] = v[2];
            cv[3] = v[3];
            gl.uniform4i(location, v[0], v[1], v[2], v[3]);
        }`,
    "mat2x2<f32>": `gl.uniformMatrix2fv(location, false, v);`,
    "mat3x3<f32>": `gl.uniformMatrix3fv(location, false, v);`,
    "mat4x4<f32>": `gl.uniformMatrix4fv(location, false, v);`
};
const UNIFORM_TO_ARRAY_SETTERS = {
    f32: `gl.uniform1fv(location, v);`,
    "vec2<f32>": `gl.uniform2fv(location, v);`,
    "vec3<f32>": `gl.uniform3fv(location, v);`,
    "vec4<f32>": `gl.uniform4fv(location, v);`,
    "mat2x2<f32>": `gl.uniformMatrix2fv(location, false, v);`,
    "mat3x3<f32>": `gl.uniformMatrix3fv(location, false, v);`,
    "mat4x4<f32>": `gl.uniformMatrix4fv(location, false, v);`,
    i32: `gl.uniform1iv(location, v);`,
    "vec2<i32>": `gl.uniform2iv(location, v);`,
    "vec3<i32>": `gl.uniform3iv(location, v);`,
    "vec4<i32>": `gl.uniform4iv(location, v);`,
    u32: `gl.uniform1iv(location, v);`,
    "vec2<u32>": `gl.uniform2iv(location, v);`,
    "vec3<u32>": `gl.uniform3iv(location, v);`,
    "vec4<u32>": `gl.uniform4iv(location, v);`,
    bool: `gl.uniform1iv(location, v);`,
    "vec2<bool>": `gl.uniform2iv(location, v);`,
    "vec3<bool>": `gl.uniform3iv(location, v);`,
    "vec4<bool>": `gl.uniform4iv(location, v);`
};
;
 //# sourceMappingURL=generateUniformsSyncTypes.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/generateUniformsSync.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "generateUniformsSync",
    ()=>generateUniformsSync
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$BufferResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/buffer/BufferResource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/UniformGroup.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$uniformParsers$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/shader/utils/uniformParsers.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$utils$2f$generateUniformsSyncTypes$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/generateUniformsSyncTypes.mjs [app-ssr] (ecmascript)");
;
;
;
;
"use strict";
function generateUniformsSync(group, uniformData) {
    const funcFragments = [
        `
        var v = null;
        var cv = null;
        var cu = null;
        var t = 0;
        var gl = renderer.gl;
        var name = null;
    `
    ];
    for(const i in group.uniforms){
        if (!uniformData[i]) {
            if (group.uniforms[i] instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$UniformGroup$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UniformGroup"]) {
                if (group.uniforms[i].ubo) {
                    funcFragments.push(`
                        renderer.shader.bindUniformBlock(uv.${i}, "${i}");
                    `);
                } else {
                    funcFragments.push(`
                        renderer.shader.updateUniformGroup(uv.${i});
                    `);
                }
            } else if (group.uniforms[i] instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$buffer$2f$BufferResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["BufferResource"]) {
                funcFragments.push(`
                        renderer.shader.bindBufferResource(uv.${i}, "${i}");
                    `);
            }
            continue;
        }
        const uniform = group.uniformStructures[i];
        let parsed = false;
        for(let j = 0; j < __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$uniformParsers$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uniformParsers"].length; j++){
            const parser = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$uniformParsers$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uniformParsers"][j];
            if (uniform.type === parser.type && parser.test(uniform)) {
                funcFragments.push(`name = "${i}";`, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$shader$2f$utils$2f$uniformParsers$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["uniformParsers"][j].uniform);
                parsed = true;
                break;
            }
        }
        if (!parsed) {
            const templateType = uniform.size === 1 ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$utils$2f$generateUniformsSyncTypes$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UNIFORM_TO_SINGLE_SETTERS"] : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$utils$2f$generateUniformsSyncTypes$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["UNIFORM_TO_ARRAY_SETTERS"];
            const template = templateType[uniform.type].replace("location", `ud["${i}"].location`);
            funcFragments.push(`
            cu = ud["${i}"];
            cv = cu.value;
            v = uv["${i}"];
            ${template};`);
        }
    }
    return new Function("ud", "uv", "renderer", "syncData", funcFragments.join("\n"));
}
;
 //# sourceMappingURL=generateUniformsSync.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlUniformGroupSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlUniformGroupSystem",
    ()=>GlUniformGroupSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$utils$2f$generateUniformsSync$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/utils/generateUniformsSync.mjs [app-ssr] (ecmascript)");
;
;
"use strict";
class GlUniformGroupSystem {
    /** @param renderer - The renderer this System works for. */ constructor(renderer){
        /** Cache to holds the generated functions. Stored against UniformObjects unique signature. */ this._cache = {};
        this._uniformGroupSyncHash = {};
        this._renderer = renderer;
        this.gl = null;
        this._cache = {};
    }
    contextChange(gl) {
        this.gl = gl;
    }
    /**
   * Uploads the uniforms values to the currently bound shader.
   * @param group - the uniforms values that be applied to the current shader
   * @param program
   * @param syncData
   * @param syncData.textureCount
   */ updateUniformGroup(group, program, syncData) {
        const programData = this._renderer.shader._getProgramData(program);
        if (!group.isStatic || group._dirtyId !== programData.uniformDirtyGroups[group.uid]) {
            programData.uniformDirtyGroups[group.uid] = group._dirtyId;
            const syncFunc = this._getUniformSyncFunction(group, program);
            syncFunc(programData.uniformData, group.uniforms, this._renderer, syncData);
        }
    }
    /**
   * Overridable by the pixi.js/unsafe-eval package to use static syncUniforms instead.
   * @param group
   * @param program
   */ _getUniformSyncFunction(group, program) {
        return this._uniformGroupSyncHash[group._signature]?.[program._key] || this._createUniformSyncFunction(group, program);
    }
    _createUniformSyncFunction(group, program) {
        const uniformGroupSyncHash = this._uniformGroupSyncHash[group._signature] || (this._uniformGroupSyncHash[group._signature] = {});
        const id = this._getSignature(group, program._uniformData, "u");
        if (!this._cache[id]) {
            this._cache[id] = this._generateUniformsSync(group, program._uniformData);
        }
        uniformGroupSyncHash[program._key] = this._cache[id];
        return uniformGroupSyncHash[program._key];
    }
    _generateUniformsSync(group, uniformData) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$utils$2f$generateUniformsSync$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["generateUniformsSync"])(group, uniformData);
    }
    /**
   * Takes a uniform group and data and generates a unique signature for them.
   * @param group - The uniform group to get signature of
   * @param group.uniforms
   * @param uniformData - Uniform information generated by the shader
   * @param preFix
   * @returns Unique signature of the uniform group
   */ _getSignature(group, uniformData, preFix) {
        const uniforms = group.uniforms;
        const strings = [
            `${preFix}-`
        ];
        for(const i in uniforms){
            strings.push(i);
            if (uniformData[i]) {
                strings.push(uniformData[i].type);
            }
        }
        return strings.join("-");
    }
    /** Destroys this System and removes all its textures. */ destroy() {
        this._renderer = null;
        this._cache = null;
    }
}
/** @ignore */ GlUniformGroupSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem
    ],
    name: "uniformGroup"
};
;
 //# sourceMappingURL=GlUniformGroupSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/state/mapWebGLBlendModesToPixi.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mapWebGLBlendModesToPixi",
    ()=>mapWebGLBlendModesToPixi
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
;
"use strict";
function mapWebGLBlendModesToPixi(gl) {
    const blendMap = {};
    blendMap.normal = [
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA
    ];
    blendMap.add = [
        gl.ONE,
        gl.ONE
    ];
    blendMap.multiply = [
        gl.DST_COLOR,
        gl.ONE_MINUS_SRC_ALPHA,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA
    ];
    blendMap.screen = [
        gl.ONE,
        gl.ONE_MINUS_SRC_COLOR,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA
    ];
    blendMap.none = [
        0,
        0
    ];
    blendMap["normal-npm"] = [
        gl.SRC_ALPHA,
        gl.ONE_MINUS_SRC_ALPHA,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA
    ];
    blendMap["add-npm"] = [
        gl.SRC_ALPHA,
        gl.ONE,
        gl.ONE,
        gl.ONE
    ];
    blendMap["screen-npm"] = [
        gl.SRC_ALPHA,
        gl.ONE_MINUS_SRC_COLOR,
        gl.ONE,
        gl.ONE_MINUS_SRC_ALPHA
    ];
    blendMap.erase = [
        gl.ZERO,
        gl.ONE_MINUS_SRC_ALPHA
    ];
    const isWebGl2 = !(gl instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().getWebGLRenderingContext());
    if (isWebGl2) {
        blendMap.min = [
            gl.ONE,
            gl.ONE,
            gl.ONE,
            gl.ONE,
            gl.MIN,
            gl.MIN
        ];
        blendMap.max = [
            gl.ONE,
            gl.ONE,
            gl.ONE,
            gl.ONE,
            gl.MAX,
            gl.MAX
        ];
    } else {
        const ext = gl.getExtension("EXT_blend_minmax");
        if (ext) {
            blendMap.min = [
                gl.ONE,
                gl.ONE,
                gl.ONE,
                gl.ONE,
                ext.MIN_EXT,
                ext.MIN_EXT
            ];
            blendMap.max = [
                gl.ONE,
                gl.ONE,
                gl.ONE,
                gl.ONE,
                ext.MAX_EXT,
                ext.MAX_EXT
            ];
        }
    }
    return blendMap;
}
;
 //# sourceMappingURL=mapWebGLBlendModesToPixi.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/state/GlStateSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlStateSystem",
    ()=>GlStateSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/state/State.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$state$2f$mapWebGLBlendModesToPixi$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/state/mapWebGLBlendModesToPixi.mjs [app-ssr] (ecmascript)");
;
;
;
"use strict";
const BLEND = 0;
const OFFSET = 1;
const CULLING = 2;
const DEPTH_TEST = 3;
const WINDING = 4;
const DEPTH_MASK = 5;
const _GlStateSystem = class _GlStateSystem {
    constructor(renderer){
        /**
     * Whether to invert the front face when rendering
     * This is used for render textures where the Y-coordinate is flipped
     * @default false
     */ this._invertFrontFace = false;
        this.gl = null;
        this.stateId = 0;
        this.polygonOffset = 0;
        this.blendMode = "none";
        this._blendEq = false;
        this.map = [];
        this.map[BLEND] = this.setBlend;
        this.map[OFFSET] = this.setOffset;
        this.map[CULLING] = this.setCullFace;
        this.map[DEPTH_TEST] = this.setDepthTest;
        this.map[WINDING] = this.setFrontFace;
        this.map[DEPTH_MASK] = this.setDepthMask;
        this.checks = [];
        this.defaultState = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$state$2f$State$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["State"].for2d();
        renderer.renderTarget.onRenderTargetChange.add(this);
    }
    onRenderTargetChange(renderTarget) {
        this._invertFrontFace = !renderTarget.isRoot;
        if (this._cullFace) {
            this.setFrontFace(this._frontFace);
        } else {
            this._frontFaceDirty = true;
        }
    }
    contextChange(gl) {
        this.gl = gl;
        this.blendModesMap = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$state$2f$mapWebGLBlendModesToPixi$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mapWebGLBlendModesToPixi"])(gl);
        this.resetState();
    }
    /**
   * Sets the current state
   * @param {*} state - The state to set.
   */ set(state) {
        state || (state = this.defaultState);
        if (this.stateId !== state.data) {
            let diff = this.stateId ^ state.data;
            let i = 0;
            while(diff){
                if (diff & 1) {
                    this.map[i].call(this, !!(state.data & 1 << i));
                }
                diff >>= 1;
                i++;
            }
            this.stateId = state.data;
        }
        for(let i = 0; i < this.checks.length; i++){
            this.checks[i](this, state);
        }
    }
    /**
   * Sets the state, when previous state is unknown.
   * @param {*} state - The state to set
   */ forceState(state) {
        state || (state = this.defaultState);
        for(let i = 0; i < this.map.length; i++){
            this.map[i].call(this, !!(state.data & 1 << i));
        }
        for(let i = 0; i < this.checks.length; i++){
            this.checks[i](this, state);
        }
        this.stateId = state.data;
    }
    /**
   * Sets whether to enable or disable blending.
   * @param value - Turn on or off WebGl blending.
   */ setBlend(value) {
        this._updateCheck(_GlStateSystem._checkBlendMode, value);
        this.gl[value ? "enable" : "disable"](this.gl.BLEND);
    }
    /**
   * Sets whether to enable or disable polygon offset fill.
   * @param value - Turn on or off webgl polygon offset testing.
   */ setOffset(value) {
        this._updateCheck(_GlStateSystem._checkPolygonOffset, value);
        this.gl[value ? "enable" : "disable"](this.gl.POLYGON_OFFSET_FILL);
    }
    /**
   * Sets whether to enable or disable depth test.
   * @param value - Turn on or off webgl depth testing.
   */ setDepthTest(value) {
        this.gl[value ? "enable" : "disable"](this.gl.DEPTH_TEST);
    }
    /**
   * Sets whether to enable or disable depth mask.
   * @param value - Turn on or off webgl depth mask.
   */ setDepthMask(value) {
        this.gl.depthMask(value);
    }
    /**
   * Sets whether to enable or disable cull face.
   * @param {boolean} value - Turn on or off webgl cull face.
   */ setCullFace(value) {
        this._cullFace = value;
        this.gl[value ? "enable" : "disable"](this.gl.CULL_FACE);
        if (this._cullFace && this._frontFaceDirty) {
            this.setFrontFace(this._frontFace);
        }
    }
    /**
   * Sets the gl front face.
   * @param {boolean} value - true is clockwise and false is counter-clockwise
   */ setFrontFace(value) {
        this._frontFace = value;
        this._frontFaceDirty = false;
        const faceMode = this._invertFrontFace ? !value : value;
        if (this._glFrontFace !== faceMode) {
            this._glFrontFace = faceMode;
            this.gl.frontFace(this.gl[faceMode ? "CW" : "CCW"]);
        }
    }
    /**
   * Sets the blend mode.
   * @param {number} value - The blend mode to set to.
   */ setBlendMode(value) {
        if (!this.blendModesMap[value]) {
            value = "normal";
        }
        if (value === this.blendMode) {
            return;
        }
        this.blendMode = value;
        const mode = this.blendModesMap[value];
        const gl = this.gl;
        if (mode.length === 2) {
            gl.blendFunc(mode[0], mode[1]);
        } else {
            gl.blendFuncSeparate(mode[0], mode[1], mode[2], mode[3]);
        }
        if (mode.length === 6) {
            this._blendEq = true;
            gl.blendEquationSeparate(mode[4], mode[5]);
        } else if (this._blendEq) {
            this._blendEq = false;
            gl.blendEquationSeparate(gl.FUNC_ADD, gl.FUNC_ADD);
        }
    }
    /**
   * Sets the polygon offset.
   * @param {number} value - the polygon offset
   * @param {number} scale - the polygon offset scale
   */ setPolygonOffset(value, scale) {
        this.gl.polygonOffset(value, scale);
    }
    /** Resets all the logic and disables the VAOs. */ resetState() {
        this._glFrontFace = false;
        this._frontFace = false;
        this._cullFace = false;
        this._frontFaceDirty = false;
        this._invertFrontFace = false;
        this.gl.frontFace(this.gl.CCW);
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
        this.forceState(this.defaultState);
        this._blendEq = true;
        this.blendMode = "";
        this.setBlendMode("normal");
    }
    /**
   * Checks to see which updates should be checked based on which settings have been activated.
   *
   * For example, if blend is enabled then we should check the blend modes each time the state is changed
   * or if polygon fill is activated then we need to check if the polygon offset changes.
   * The idea is that we only check what we have too.
   * @param func - the checking function to add or remove
   * @param value - should the check function be added or removed.
   */ _updateCheck(func, value) {
        const index = this.checks.indexOf(func);
        if (value && index === -1) {
            this.checks.push(func);
        } else if (!value && index !== -1) {
            this.checks.splice(index, 1);
        }
    }
    /**
   * A private little wrapper function that we call to check the blend mode.
   * @param system - the System to perform the state check on
   * @param state - the state that the blendMode will pulled from
   */ static _checkBlendMode(system, state) {
        system.setBlendMode(state.blendMode);
    }
    /**
   * A private little wrapper function that we call to check the polygon offset.
   * @param system - the System to perform the state check on
   * @param state - the state that the blendMode will pulled from
   */ static _checkPolygonOffset(system, state) {
        system.setPolygonOffset(1, state.polygonOffset);
    }
    /** @ignore */ destroy() {
        this.gl = null;
        this.checks.length = 0;
    }
};
/** @ignore */ _GlStateSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem
    ],
    name: "state"
};
let GlStateSystem = _GlStateSystem;
;
 //# sourceMappingURL=GlStateSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/GlTexture.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlTexture",
    ()=>GlTexture
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/const.mjs [app-ssr] (ecmascript)");
;
"use strict";
class GlTexture {
    constructor(texture){
        this.target = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TARGETS"].TEXTURE_2D;
        this.texture = texture;
        this.width = -1;
        this.height = -1;
        this.type = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_TYPES"].UNSIGNED_BYTE;
        this.internalFormat = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_FORMATS"].RGBA;
        this.format = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$const$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GL_FORMATS"].RGBA;
        this.samplerType = 0;
    }
}
;
 //# sourceMappingURL=GlTexture.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadBufferImageResource.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "glUploadBufferImageResource",
    ()=>glUploadBufferImageResource
]);
"use strict";
const glUploadBufferImageResource = {
    id: "buffer",
    upload (source, glTexture, gl) {
        if (glTexture.width === source.width || glTexture.height === source.height) {
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, source.width, source.height, glTexture.format, glTexture.type, source.resource);
        } else {
            gl.texImage2D(glTexture.target, 0, glTexture.internalFormat, source.width, source.height, 0, glTexture.format, glTexture.type, source.resource);
        }
        glTexture.width = source.width;
        glTexture.height = source.height;
    }
};
;
 //# sourceMappingURL=glUploadBufferImageResource.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadCompressedTextureResource.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "glUploadCompressedTextureResource",
    ()=>glUploadCompressedTextureResource
]);
"use strict";
const compressedFormatMap = {
    "bc1-rgba-unorm": true,
    "bc1-rgba-unorm-srgb": true,
    "bc2-rgba-unorm": true,
    "bc2-rgba-unorm-srgb": true,
    "bc3-rgba-unorm": true,
    "bc3-rgba-unorm-srgb": true,
    "bc4-r-unorm": true,
    "bc4-r-snorm": true,
    "bc5-rg-unorm": true,
    "bc5-rg-snorm": true,
    "bc6h-rgb-ufloat": true,
    "bc6h-rgb-float": true,
    "bc7-rgba-unorm": true,
    "bc7-rgba-unorm-srgb": true,
    // ETC2 compressed formats usable if "texture-compression-etc2" is both
    // supported by the device/user agent and enabled in requestDevice.
    "etc2-rgb8unorm": true,
    "etc2-rgb8unorm-srgb": true,
    "etc2-rgb8a1unorm": true,
    "etc2-rgb8a1unorm-srgb": true,
    "etc2-rgba8unorm": true,
    "etc2-rgba8unorm-srgb": true,
    "eac-r11unorm": true,
    "eac-r11snorm": true,
    "eac-rg11unorm": true,
    "eac-rg11snorm": true,
    // ASTC compressed formats usable if "texture-compression-astc" is both
    // supported by the device/user agent and enabled in requestDevice.
    "astc-4x4-unorm": true,
    "astc-4x4-unorm-srgb": true,
    "astc-5x4-unorm": true,
    "astc-5x4-unorm-srgb": true,
    "astc-5x5-unorm": true,
    "astc-5x5-unorm-srgb": true,
    "astc-6x5-unorm": true,
    "astc-6x5-unorm-srgb": true,
    "astc-6x6-unorm": true,
    "astc-6x6-unorm-srgb": true,
    "astc-8x5-unorm": true,
    "astc-8x5-unorm-srgb": true,
    "astc-8x6-unorm": true,
    "astc-8x6-unorm-srgb": true,
    "astc-8x8-unorm": true,
    "astc-8x8-unorm-srgb": true,
    "astc-10x5-unorm": true,
    "astc-10x5-unorm-srgb": true,
    "astc-10x6-unorm": true,
    "astc-10x6-unorm-srgb": true,
    "astc-10x8-unorm": true,
    "astc-10x8-unorm-srgb": true,
    "astc-10x10-unorm": true,
    "astc-10x10-unorm-srgb": true,
    "astc-12x10-unorm": true,
    "astc-12x10-unorm-srgb": true,
    "astc-12x12-unorm": true,
    "astc-12x12-unorm-srgb": true
};
const glUploadCompressedTextureResource = {
    id: "compressed",
    upload (source, glTexture, gl) {
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 4);
        let mipWidth = source.pixelWidth;
        let mipHeight = source.pixelHeight;
        const compressed = !!compressedFormatMap[source.format];
        for(let i = 0; i < source.resource.length; i++){
            const levelBuffer = source.resource[i];
            if (compressed) {
                gl.compressedTexImage2D(gl.TEXTURE_2D, i, glTexture.internalFormat, mipWidth, mipHeight, 0, levelBuffer);
            } else {
                gl.texImage2D(gl.TEXTURE_2D, i, glTexture.internalFormat, mipWidth, mipHeight, 0, glTexture.format, glTexture.type, levelBuffer);
            }
            mipWidth = Math.max(mipWidth >> 1, 1);
            mipHeight = Math.max(mipHeight >> 1, 1);
        }
    }
};
;
 //# sourceMappingURL=glUploadCompressedTextureResource.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadImageResource.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "glUploadImageResource",
    ()=>glUploadImageResource
]);
"use strict";
const glUploadImageResource = {
    id: "image",
    upload (source, glTexture, gl, webGLVersion) {
        const glWidth = glTexture.width;
        const glHeight = glTexture.height;
        const textureWidth = source.pixelWidth;
        const textureHeight = source.pixelHeight;
        const resourceWidth = source.resourceWidth;
        const resourceHeight = source.resourceHeight;
        if (resourceWidth < textureWidth || resourceHeight < textureHeight) {
            if (glWidth !== textureWidth || glHeight !== textureHeight) {
                gl.texImage2D(glTexture.target, 0, glTexture.internalFormat, textureWidth, textureHeight, 0, glTexture.format, glTexture.type, null);
            }
            if (webGLVersion === 2) {
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, resourceWidth, resourceHeight, glTexture.format, glTexture.type, source.resource);
            } else {
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, glTexture.format, glTexture.type, source.resource);
            }
        } else if (glWidth === textureWidth && glHeight === textureHeight) {
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, glTexture.format, glTexture.type, source.resource);
        } else if (webGLVersion === 2) {
            gl.texImage2D(glTexture.target, 0, glTexture.internalFormat, textureWidth, textureHeight, 0, glTexture.format, glTexture.type, source.resource);
        } else {
            gl.texImage2D(glTexture.target, 0, glTexture.internalFormat, glTexture.format, glTexture.type, source.resource);
        }
        glTexture.width = textureWidth;
        glTexture.height = textureHeight;
    }
};
;
 //# sourceMappingURL=glUploadImageResource.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadVideoResource.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "glUploadVideoResource",
    ()=>glUploadVideoResource
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$uploaders$2f$glUploadImageResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadImageResource.mjs [app-ssr] (ecmascript)");
;
"use strict";
const glUploadVideoResource = {
    id: "video",
    upload (source, glTexture, gl, webGLVersion) {
        if (!source.isValid) {
            gl.texImage2D(glTexture.target, 0, glTexture.internalFormat, 1, 1, 0, glTexture.format, glTexture.type, null);
            return;
        }
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$uploaders$2f$glUploadImageResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["glUploadImageResource"].upload(source, glTexture, gl, webGLVersion);
    }
};
;
 //# sourceMappingURL=glUploadVideoResource.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/pixiToGlMaps.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "compareModeToGlCompare",
    ()=>compareModeToGlCompare,
    "mipmapScaleModeToGlFilter",
    ()=>mipmapScaleModeToGlFilter,
    "scaleModeToGlFilter",
    ()=>scaleModeToGlFilter,
    "wrapModeToGlAddress",
    ()=>wrapModeToGlAddress
]);
"use strict";
const scaleModeToGlFilter = {
    linear: 9729,
    nearest: 9728
};
const mipmapScaleModeToGlFilter = {
    linear: {
        linear: 9987,
        nearest: 9985
    },
    nearest: {
        linear: 9986,
        nearest: 9984
    }
};
const wrapModeToGlAddress = {
    "clamp-to-edge": 33071,
    repeat: 10497,
    "mirror-repeat": 33648
};
const compareModeToGlCompare = {
    never: 512,
    less: 513,
    equal: 514,
    "less-equal": 515,
    greater: 516,
    "not-equal": 517,
    "greater-equal": 518,
    always: 519
};
;
 //# sourceMappingURL=pixiToGlMaps.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/applyStyleParams.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "applyStyleParams",
    ()=>applyStyleParams
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$utils$2f$pixiToGlMaps$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/pixiToGlMaps.mjs [app-ssr] (ecmascript)");
;
"use strict";
function applyStyleParams(style, gl, mipmaps, anisotropicExt, glFunctionName, firstParam, forceClamp, firstCreation) {
    const castParam = firstParam;
    if (!firstCreation || style.addressModeU !== "repeat" || style.addressModeV !== "repeat" || style.addressModeW !== "repeat") {
        const wrapModeS = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$utils$2f$pixiToGlMaps$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["wrapModeToGlAddress"][forceClamp ? "clamp-to-edge" : style.addressModeU];
        const wrapModeT = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$utils$2f$pixiToGlMaps$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["wrapModeToGlAddress"][forceClamp ? "clamp-to-edge" : style.addressModeV];
        const wrapModeR = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$utils$2f$pixiToGlMaps$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["wrapModeToGlAddress"][forceClamp ? "clamp-to-edge" : style.addressModeW];
        gl[glFunctionName](castParam, gl.TEXTURE_WRAP_S, wrapModeS);
        gl[glFunctionName](castParam, gl.TEXTURE_WRAP_T, wrapModeT);
        if (gl.TEXTURE_WRAP_R) gl[glFunctionName](castParam, gl.TEXTURE_WRAP_R, wrapModeR);
    }
    if (!firstCreation || style.magFilter !== "linear") {
        gl[glFunctionName](castParam, gl.TEXTURE_MAG_FILTER, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$utils$2f$pixiToGlMaps$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["scaleModeToGlFilter"][style.magFilter]);
    }
    if (mipmaps) {
        if (!firstCreation || style.mipmapFilter !== "linear") {
            const glFilterMode = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$utils$2f$pixiToGlMaps$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mipmapScaleModeToGlFilter"][style.minFilter][style.mipmapFilter];
            gl[glFunctionName](castParam, gl.TEXTURE_MIN_FILTER, glFilterMode);
        }
    } else {
        gl[glFunctionName](castParam, gl.TEXTURE_MIN_FILTER, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$utils$2f$pixiToGlMaps$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["scaleModeToGlFilter"][style.minFilter]);
    }
    if (anisotropicExt && style.maxAnisotropy > 1) {
        const level = Math.min(style.maxAnisotropy, gl.getParameter(anisotropicExt.MAX_TEXTURE_MAX_ANISOTROPY_EXT));
        gl[glFunctionName](castParam, anisotropicExt.TEXTURE_MAX_ANISOTROPY_EXT, level);
    }
    if (style.compare) {
        gl[glFunctionName](castParam, gl.TEXTURE_COMPARE_FUNC, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$utils$2f$pixiToGlMaps$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["compareModeToGlCompare"][style.compare]);
    }
}
;
 //# sourceMappingURL=applyStyleParams.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapFormatToGlFormat.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mapFormatToGlFormat",
    ()=>mapFormatToGlFormat
]);
"use strict";
function mapFormatToGlFormat(gl) {
    return {
        // 8-bit formats
        r8unorm: gl.RED,
        r8snorm: gl.RED,
        r8uint: gl.RED,
        r8sint: gl.RED,
        // 16-bit formats
        r16uint: gl.RED,
        r16sint: gl.RED,
        r16float: gl.RED,
        rg8unorm: gl.RG,
        rg8snorm: gl.RG,
        rg8uint: gl.RG,
        rg8sint: gl.RG,
        // 32-bit formats
        r32uint: gl.RED,
        r32sint: gl.RED,
        r32float: gl.RED,
        rg16uint: gl.RG,
        rg16sint: gl.RG,
        rg16float: gl.RG,
        rgba8unorm: gl.RGBA,
        "rgba8unorm-srgb": gl.RGBA,
        // Packed 32-bit formats
        rgba8snorm: gl.RGBA,
        rgba8uint: gl.RGBA,
        rgba8sint: gl.RGBA,
        bgra8unorm: gl.RGBA,
        "bgra8unorm-srgb": gl.RGBA,
        rgb9e5ufloat: gl.RGB,
        rgb10a2unorm: gl.RGBA,
        rg11b10ufloat: gl.RGB,
        // 64-bit formats
        rg32uint: gl.RG,
        rg32sint: gl.RG,
        rg32float: gl.RG,
        rgba16uint: gl.RGBA,
        rgba16sint: gl.RGBA,
        rgba16float: gl.RGBA,
        // 128-bit formats
        rgba32uint: gl.RGBA,
        rgba32sint: gl.RGBA,
        rgba32float: gl.RGBA,
        // Depth/stencil formats
        stencil8: gl.STENCIL_INDEX8,
        depth16unorm: gl.DEPTH_COMPONENT,
        depth24plus: gl.DEPTH_COMPONENT,
        "depth24plus-stencil8": gl.DEPTH_STENCIL,
        depth32float: gl.DEPTH_COMPONENT,
        "depth32float-stencil8": gl.DEPTH_STENCIL
    };
}
;
 //# sourceMappingURL=mapFormatToGlFormat.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapFormatToGlInternalFormat.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mapFormatToGlInternalFormat",
    ()=>mapFormatToGlInternalFormat
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
;
"use strict";
function mapFormatToGlInternalFormat(gl, extensions) {
    let srgb = {};
    let bgra8unorm = gl.RGBA;
    if (!(gl instanceof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().getWebGLRenderingContext())) {
        srgb = {
            "rgba8unorm-srgb": gl.SRGB8_ALPHA8,
            "bgra8unorm-srgb": gl.SRGB8_ALPHA8
        };
        bgra8unorm = gl.RGBA8;
    } else if (extensions.srgb) {
        srgb = {
            "rgba8unorm-srgb": extensions.srgb.SRGB8_ALPHA8_EXT,
            "bgra8unorm-srgb": extensions.srgb.SRGB8_ALPHA8_EXT
        };
    }
    return {
        // 8-bit formats
        r8unorm: gl.R8,
        r8snorm: gl.R8_SNORM,
        r8uint: gl.R8UI,
        r8sint: gl.R8I,
        // 16-bit formats
        r16uint: gl.R16UI,
        r16sint: gl.R16I,
        r16float: gl.R16F,
        rg8unorm: gl.RG8,
        rg8snorm: gl.RG8_SNORM,
        rg8uint: gl.RG8UI,
        rg8sint: gl.RG8I,
        // 32-bit formats
        r32uint: gl.R32UI,
        r32sint: gl.R32I,
        r32float: gl.R32F,
        rg16uint: gl.RG16UI,
        rg16sint: gl.RG16I,
        rg16float: gl.RG16F,
        rgba8unorm: gl.RGBA,
        ...srgb,
        // Packed 32-bit formats
        rgba8snorm: gl.RGBA8_SNORM,
        rgba8uint: gl.RGBA8UI,
        rgba8sint: gl.RGBA8I,
        bgra8unorm,
        rgb9e5ufloat: gl.RGB9_E5,
        rgb10a2unorm: gl.RGB10_A2,
        rg11b10ufloat: gl.R11F_G11F_B10F,
        // 64-bit formats
        rg32uint: gl.RG32UI,
        rg32sint: gl.RG32I,
        rg32float: gl.RG32F,
        rgba16uint: gl.RGBA16UI,
        rgba16sint: gl.RGBA16I,
        rgba16float: gl.RGBA16F,
        // 128-bit formats
        rgba32uint: gl.RGBA32UI,
        rgba32sint: gl.RGBA32I,
        rgba32float: gl.RGBA32F,
        // Depth/stencil formats
        stencil8: gl.STENCIL_INDEX8,
        depth16unorm: gl.DEPTH_COMPONENT16,
        depth24plus: gl.DEPTH_COMPONENT24,
        "depth24plus-stencil8": gl.DEPTH24_STENCIL8,
        depth32float: gl.DEPTH_COMPONENT32F,
        "depth32float-stencil8": gl.DEPTH32F_STENCIL8,
        // Compressed formats
        ...extensions.s3tc ? {
            "bc1-rgba-unorm": extensions.s3tc.COMPRESSED_RGBA_S3TC_DXT1_EXT,
            "bc2-rgba-unorm": extensions.s3tc.COMPRESSED_RGBA_S3TC_DXT3_EXT,
            "bc3-rgba-unorm": extensions.s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT
        } : {},
        ...extensions.s3tc_sRGB ? {
            "bc1-rgba-unorm-srgb": extensions.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT,
            "bc2-rgba-unorm-srgb": extensions.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT,
            "bc3-rgba-unorm-srgb": extensions.s3tc_sRGB.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT
        } : {},
        ...extensions.rgtc ? {
            "bc4-r-unorm": extensions.rgtc.COMPRESSED_RED_RGTC1_EXT,
            "bc4-r-snorm": extensions.rgtc.COMPRESSED_SIGNED_RED_RGTC1_EXT,
            "bc5-rg-unorm": extensions.rgtc.COMPRESSED_RED_GREEN_RGTC2_EXT,
            "bc5-rg-snorm": extensions.rgtc.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT
        } : {},
        ...extensions.bptc ? {
            "bc6h-rgb-float": extensions.bptc.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT,
            "bc6h-rgb-ufloat": extensions.bptc.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT,
            "bc7-rgba-unorm": extensions.bptc.COMPRESSED_RGBA_BPTC_UNORM_EXT,
            "bc7-rgba-unorm-srgb": extensions.bptc.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT
        } : {},
        ...extensions.etc ? {
            "etc2-rgb8unorm": extensions.etc.COMPRESSED_RGB8_ETC2,
            "etc2-rgb8unorm-srgb": extensions.etc.COMPRESSED_SRGB8_ETC2,
            "etc2-rgb8a1unorm": extensions.etc.COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2,
            "etc2-rgb8a1unorm-srgb": extensions.etc.COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2,
            "etc2-rgba8unorm": extensions.etc.COMPRESSED_RGBA8_ETC2_EAC,
            "etc2-rgba8unorm-srgb": extensions.etc.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC,
            "eac-r11unorm": extensions.etc.COMPRESSED_R11_EAC,
            // 'eac-r11snorm'
            "eac-rg11unorm": extensions.etc.COMPRESSED_SIGNED_RG11_EAC
        } : {},
        ...extensions.astc ? {
            "astc-4x4-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_4x4_KHR,
            "astc-4x4-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR,
            "astc-5x4-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_5x4_KHR,
            "astc-5x4-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR,
            "astc-5x5-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_5x5_KHR,
            "astc-5x5-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR,
            "astc-6x5-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_6x5_KHR,
            "astc-6x5-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR,
            "astc-6x6-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_6x6_KHR,
            "astc-6x6-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR,
            "astc-8x5-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_8x5_KHR,
            "astc-8x5-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR,
            "astc-8x6-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_8x6_KHR,
            "astc-8x6-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR,
            "astc-8x8-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_8x8_KHR,
            "astc-8x8-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR,
            "astc-10x5-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_10x5_KHR,
            "astc-10x5-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR,
            "astc-10x6-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_10x6_KHR,
            "astc-10x6-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR,
            "astc-10x8-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_10x8_KHR,
            "astc-10x8-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR,
            "astc-10x10-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_10x10_KHR,
            "astc-10x10-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR,
            "astc-12x10-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_12x10_KHR,
            "astc-12x10-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR,
            "astc-12x12-unorm": extensions.astc.COMPRESSED_RGBA_ASTC_12x12_KHR,
            "astc-12x12-unorm-srgb": extensions.astc.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR
        } : {}
    };
}
;
 //# sourceMappingURL=mapFormatToGlInternalFormat.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapFormatToGlType.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mapFormatToGlType",
    ()=>mapFormatToGlType
]);
"use strict";
function mapFormatToGlType(gl) {
    return {
        // 8-bit formats
        r8unorm: gl.UNSIGNED_BYTE,
        r8snorm: gl.BYTE,
        r8uint: gl.UNSIGNED_BYTE,
        r8sint: gl.BYTE,
        // 16-bit formats
        r16uint: gl.UNSIGNED_SHORT,
        r16sint: gl.SHORT,
        r16float: gl.HALF_FLOAT,
        rg8unorm: gl.UNSIGNED_BYTE,
        rg8snorm: gl.BYTE,
        rg8uint: gl.UNSIGNED_BYTE,
        rg8sint: gl.BYTE,
        // 32-bit formats
        r32uint: gl.UNSIGNED_INT,
        r32sint: gl.INT,
        r32float: gl.FLOAT,
        rg16uint: gl.UNSIGNED_SHORT,
        rg16sint: gl.SHORT,
        rg16float: gl.HALF_FLOAT,
        rgba8unorm: gl.UNSIGNED_BYTE,
        "rgba8unorm-srgb": gl.UNSIGNED_BYTE,
        // Packed 32-bit formats
        rgba8snorm: gl.BYTE,
        rgba8uint: gl.UNSIGNED_BYTE,
        rgba8sint: gl.BYTE,
        bgra8unorm: gl.UNSIGNED_BYTE,
        "bgra8unorm-srgb": gl.UNSIGNED_BYTE,
        rgb9e5ufloat: gl.UNSIGNED_INT_5_9_9_9_REV,
        rgb10a2unorm: gl.UNSIGNED_INT_2_10_10_10_REV,
        rg11b10ufloat: gl.UNSIGNED_INT_10F_11F_11F_REV,
        // 64-bit formats
        rg32uint: gl.UNSIGNED_INT,
        rg32sint: gl.INT,
        rg32float: gl.FLOAT,
        rgba16uint: gl.UNSIGNED_SHORT,
        rgba16sint: gl.SHORT,
        rgba16float: gl.HALF_FLOAT,
        // 128-bit formats
        rgba32uint: gl.UNSIGNED_INT,
        rgba32sint: gl.INT,
        rgba32float: gl.FLOAT,
        // Depth/stencil formats
        stencil8: gl.UNSIGNED_BYTE,
        depth16unorm: gl.UNSIGNED_SHORT,
        depth24plus: gl.UNSIGNED_INT,
        "depth24plus-stencil8": gl.UNSIGNED_INT_24_8,
        depth32float: gl.FLOAT,
        "depth32float-stencil8": gl.FLOAT_32_UNSIGNED_INT_24_8_REV
    };
}
;
 //# sourceMappingURL=mapFormatToGlType.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/GlTextureSystem.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GlTextureSystem",
    ()=>GlTextureSystem
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/environment/adapter.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/texture/Texture.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$GlTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/GlTexture.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$uploaders$2f$glUploadBufferImageResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadBufferImageResource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$uploaders$2f$glUploadCompressedTextureResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadCompressedTextureResource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$uploaders$2f$glUploadImageResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadImageResource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$uploaders$2f$glUploadVideoResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/uploaders/glUploadVideoResource.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$utils$2f$applyStyleParams$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/applyStyleParams.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$utils$2f$mapFormatToGlFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapFormatToGlFormat.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$utils$2f$mapFormatToGlInternalFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapFormatToGlInternalFormat.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$utils$2f$mapFormatToGlType$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/utils/mapFormatToGlType.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
"use strict";
const BYTES_PER_PIXEL = 4;
class GlTextureSystem {
    constructor(renderer){
        this.managedTextures = [];
        this._glTextures = /* @__PURE__ */ Object.create(null);
        this._glSamplers = /* @__PURE__ */ Object.create(null);
        this._boundTextures = [];
        this._activeTextureLocation = -1;
        this._boundSamplers = /* @__PURE__ */ Object.create(null);
        this._uploads = {
            image: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$uploaders$2f$glUploadImageResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["glUploadImageResource"],
            buffer: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$uploaders$2f$glUploadBufferImageResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["glUploadBufferImageResource"],
            video: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$uploaders$2f$glUploadVideoResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["glUploadVideoResource"],
            compressed: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$uploaders$2f$glUploadCompressedTextureResource$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["glUploadCompressedTextureResource"]
        };
        this._premultiplyAlpha = false;
        // TODO - separate samplers will be a cool thing to add, but not right now!
        this._useSeparateSamplers = false;
        this._renderer = renderer;
        this._renderer.renderableGC.addManagedHash(this, "_glTextures");
        this._renderer.renderableGC.addManagedHash(this, "_glSamplers");
    }
    contextChange(gl) {
        this._gl = gl;
        if (!this._mapFormatToInternalFormat) {
            this._mapFormatToInternalFormat = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$utils$2f$mapFormatToGlInternalFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mapFormatToGlInternalFormat"])(gl, this._renderer.context.extensions);
            this._mapFormatToType = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$utils$2f$mapFormatToGlType$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mapFormatToGlType"])(gl);
            this._mapFormatToFormat = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$utils$2f$mapFormatToGlFormat$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mapFormatToGlFormat"])(gl);
        }
        this._glTextures = /* @__PURE__ */ Object.create(null);
        this._glSamplers = /* @__PURE__ */ Object.create(null);
        this._boundSamplers = /* @__PURE__ */ Object.create(null);
        this._premultiplyAlpha = false;
        for(let i = 0; i < 16; i++){
            this.bind(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"].EMPTY, i);
        }
    }
    /**
   * Initializes a texture source, if it has already been initialized nothing will happen.
   * @param source - The texture source to initialize.
   * @returns The initialized texture source.
   */ initSource(source) {
        this.bind(source);
    }
    bind(texture, location = 0) {
        const source = texture.source;
        if (texture) {
            this.bindSource(source, location);
            if (this._useSeparateSamplers) {
                this._bindSampler(source.style, location);
            }
        } else {
            this.bindSource(null, location);
            if (this._useSeparateSamplers) {
                this._bindSampler(null, location);
            }
        }
    }
    bindSource(source, location = 0) {
        const gl = this._gl;
        source._touched = this._renderer.textureGC.count;
        if (this._boundTextures[location] !== source) {
            this._boundTextures[location] = source;
            this._activateLocation(location);
            source || (source = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"].EMPTY.source);
            const glTexture = this.getGlSource(source);
            gl.bindTexture(glTexture.target, glTexture.texture);
        }
    }
    _bindSampler(style, location = 0) {
        const gl = this._gl;
        if (!style) {
            this._boundSamplers[location] = null;
            gl.bindSampler(location, null);
            return;
        }
        const sampler = this._getGlSampler(style);
        if (this._boundSamplers[location] !== sampler) {
            this._boundSamplers[location] = sampler;
            gl.bindSampler(location, sampler);
        }
    }
    unbind(texture) {
        const source = texture.source;
        const boundTextures = this._boundTextures;
        const gl = this._gl;
        for(let i = 0; i < boundTextures.length; i++){
            if (boundTextures[i] === source) {
                this._activateLocation(i);
                const glTexture = this.getGlSource(source);
                gl.bindTexture(glTexture.target, null);
                boundTextures[i] = null;
            }
        }
    }
    _activateLocation(location) {
        if (this._activeTextureLocation !== location) {
            this._activeTextureLocation = location;
            this._gl.activeTexture(this._gl.TEXTURE0 + location);
        }
    }
    _initSource(source) {
        const gl = this._gl;
        const glTexture = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$GlTexture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlTexture"](gl.createTexture());
        glTexture.type = this._mapFormatToType[source.format];
        glTexture.internalFormat = this._mapFormatToInternalFormat[source.format];
        glTexture.format = this._mapFormatToFormat[source.format];
        if (source.autoGenerateMipmaps && (this._renderer.context.supports.nonPowOf2mipmaps || source.isPowerOfTwo)) {
            const biggestDimension = Math.max(source.width, source.height);
            source.mipLevelCount = Math.floor(Math.log2(biggestDimension)) + 1;
        }
        this._glTextures[source.uid] = glTexture;
        if (!this.managedTextures.includes(source)) {
            source.on("update", this.onSourceUpdate, this);
            source.on("resize", this.onSourceUpdate, this);
            source.on("styleChange", this.onStyleChange, this);
            source.on("destroy", this.onSourceDestroy, this);
            source.on("unload", this.onSourceUnload, this);
            source.on("updateMipmaps", this.onUpdateMipmaps, this);
            this.managedTextures.push(source);
        }
        this.onSourceUpdate(source);
        this.updateStyle(source, false);
        return glTexture;
    }
    onStyleChange(source) {
        this.updateStyle(source, false);
    }
    updateStyle(source, firstCreation) {
        const gl = this._gl;
        const glTexture = this.getGlSource(source);
        gl.bindTexture(gl.TEXTURE_2D, glTexture.texture);
        this._boundTextures[this._activeTextureLocation] = source;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$utils$2f$applyStyleParams$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["applyStyleParams"])(source.style, gl, source.mipLevelCount > 1, this._renderer.context.extensions.anisotropicFiltering, "texParameteri", gl.TEXTURE_2D, // will force a clamp to edge if the texture is not a power of two
        !this._renderer.context.supports.nonPowOf2wrapping && !source.isPowerOfTwo, firstCreation);
    }
    onSourceUnload(source) {
        const glTexture = this._glTextures[source.uid];
        if (!glTexture) return;
        this.unbind(source);
        this._glTextures[source.uid] = null;
        this._gl.deleteTexture(glTexture.texture);
    }
    onSourceUpdate(source) {
        const gl = this._gl;
        const glTexture = this.getGlSource(source);
        gl.bindTexture(gl.TEXTURE_2D, glTexture.texture);
        this._boundTextures[this._activeTextureLocation] = source;
        const premultipliedAlpha = source.alphaMode === "premultiply-alpha-on-upload";
        if (this._premultiplyAlpha !== premultipliedAlpha) {
            this._premultiplyAlpha = premultipliedAlpha;
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premultipliedAlpha);
        }
        if (this._uploads[source.uploadMethodId]) {
            this._uploads[source.uploadMethodId].upload(source, glTexture, gl, this._renderer.context.webGLVersion);
        } else {
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, source.pixelWidth, source.pixelHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }
        if (source.autoGenerateMipmaps && source.mipLevelCount > 1) {
            this.onUpdateMipmaps(source, false);
        }
    }
    onUpdateMipmaps(source, bind = true) {
        if (bind) this.bindSource(source, 0);
        const glTexture = this.getGlSource(source);
        this._gl.generateMipmap(glTexture.target);
    }
    onSourceDestroy(source) {
        source.off("destroy", this.onSourceDestroy, this);
        source.off("update", this.onSourceUpdate, this);
        source.off("resize", this.onSourceUpdate, this);
        source.off("unload", this.onSourceUnload, this);
        source.off("styleChange", this.onStyleChange, this);
        source.off("updateMipmaps", this.onUpdateMipmaps, this);
        this.managedTextures.splice(this.managedTextures.indexOf(source), 1);
        this.onSourceUnload(source);
    }
    _initSampler(style) {
        const gl = this._gl;
        const glSampler = this._gl.createSampler();
        this._glSamplers[style._resourceId] = glSampler;
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$utils$2f$applyStyleParams$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["applyStyleParams"])(style, gl, this._boundTextures[this._activeTextureLocation].mipLevelCount > 1, this._renderer.context.extensions.anisotropicFiltering, "samplerParameteri", glSampler, false, true);
        return this._glSamplers[style._resourceId];
    }
    _getGlSampler(sampler) {
        return this._glSamplers[sampler._resourceId] || this._initSampler(sampler);
    }
    getGlSource(source) {
        return this._glTextures[source.uid] || this._initSource(source);
    }
    generateCanvas(texture) {
        const { pixels, width, height } = this.getPixels(texture);
        const canvas = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$environment$2f$adapter$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["DOMAdapter"].get().createCanvas();
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            const imageData = ctx.createImageData(width, height);
            imageData.data.set(pixels);
            ctx.putImageData(imageData, 0, 0);
        }
        return canvas;
    }
    getPixels(texture) {
        const resolution = texture.source.resolution;
        const frame = texture.frame;
        const width = Math.max(Math.round(frame.width * resolution), 1);
        const height = Math.max(Math.round(frame.height * resolution), 1);
        const pixels = new Uint8Array(BYTES_PER_PIXEL * width * height);
        const renderer = this._renderer;
        const renderTarget = renderer.renderTarget.getRenderTarget(texture);
        const glRenterTarget = renderer.renderTarget.getGpuRenderTarget(renderTarget);
        const gl = renderer.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, glRenterTarget.resolveTargetFramebuffer);
        gl.readPixels(Math.round(frame.x * resolution), Math.round(frame.y * resolution), width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        return {
            pixels: new Uint8ClampedArray(pixels.buffer),
            width,
            height
        };
    }
    destroy() {
        this.managedTextures.slice().forEach((source)=>this.onSourceDestroy(source));
        this.managedTextures = null;
        this._glTextures = null;
        this._glSamplers = null;
        this._boundTextures = null;
        this._boundSamplers = null;
        this._mapFormatToInternalFormat = null;
        this._mapFormatToType = null;
        this._mapFormatToFormat = null;
        this._uploads = null;
        this._renderer = null;
    }
    resetState() {
        this._activeTextureLocation = -1;
        this._boundTextures.fill(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$texture$2f$Texture$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Texture"].EMPTY.source);
        this._boundSamplers = /* @__PURE__ */ Object.create(null);
        const gl = this._gl;
        this._premultiplyAlpha = false;
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this._premultiplyAlpha);
    }
}
/** @ignore */ GlTextureSystem.extension = {
    type: [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem
    ],
    name: "texture"
};
;
 //# sourceMappingURL=GlTextureSystem.mjs.map
}),
"[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/WebGLRenderer.mjs [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "WebGLRenderer",
    ()=>WebGLRenderer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/extensions/Extensions.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$gl$2f$GlGraphicsAdaptor$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/graphics/gl/GlGraphicsAdaptor.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2f$gl$2f$GlMeshAdaptor$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/scene/mesh/gl/GlMeshAdaptor.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$gl$2f$GlBatchAdaptor$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/batcher/gl/GlBatchAdaptor.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$AbstractRenderer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/system/AbstractRenderer.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$SharedSystems$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/shared/system/SharedSystems.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/types.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$buffer$2f$GlBufferSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/buffer/GlBufferSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$context$2f$GlContextSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/context/GlContextSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$geometry$2f$GlGeometrySystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/geometry/GlGeometrySystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$GlBackBufferSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/GlBackBufferSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$GlColorMaskSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/GlColorMaskSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$GlEncoderSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/GlEncoderSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$GlLimitsSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/GlLimitsSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$GlStencilSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/GlStencilSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$GlUboSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/GlUboSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$renderTarget$2f$GlRenderTargetSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/renderTarget/GlRenderTargetSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlShaderSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlShaderSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlUniformGroupSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/shader/GlUniformGroupSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$state$2f$GlStateSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/state/GlStateSystem.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$GlTextureSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/pixi.js@8.13.1/node_modules/pixi.js/lib/rendering/renderers/gl/texture/GlTextureSystem.mjs [app-ssr] (ecmascript)");
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
;
"use strict";
const DefaultWebGLSystems = [
    ...__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$SharedSystems$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SharedSystems"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$GlUboSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlUboSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$GlBackBufferSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlBackBufferSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$context$2f$GlContextSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlContextSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$GlLimitsSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlLimitsSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$buffer$2f$GlBufferSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlBufferSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$texture$2f$GlTextureSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlTextureSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$renderTarget$2f$GlRenderTargetSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlRenderTargetSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$geometry$2f$GlGeometrySystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlGeometrySystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlUniformGroupSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlUniformGroupSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$shader$2f$GlShaderSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlShaderSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$GlEncoderSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlEncoderSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$state$2f$GlStateSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlStateSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$GlStencilSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlStencilSystem"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$gl$2f$GlColorMaskSystem$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlColorMaskSystem"]
];
const DefaultWebGLPipes = [
    ...__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$SharedSystems$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["SharedRenderPipes"]
];
const DefaultWebGLAdapters = [
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$batcher$2f$gl$2f$GlBatchAdaptor$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlBatchAdaptor"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$mesh$2f$gl$2f$GlMeshAdaptor$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlMeshAdaptor"],
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$scene$2f$graphics$2f$gl$2f$GlGraphicsAdaptor$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["GlGraphicsAdaptor"]
];
const systems = [];
const renderPipes = [];
const renderPipeAdaptors = [];
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].handleByNamedList(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLSystem, systems);
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].handleByNamedList(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipes, renderPipes);
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].handleByNamedList(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ExtensionType"].WebGLPipesAdaptor, renderPipeAdaptors);
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$extensions$2f$Extensions$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["extensions"].add(...DefaultWebGLSystems, ...DefaultWebGLPipes, ...DefaultWebGLAdapters);
class WebGLRenderer extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$shared$2f$system$2f$AbstractRenderer$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AbstractRenderer"] {
    constructor(){
        const systemConfig = {
            name: "webgl",
            type: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$pixi$2e$js$40$8$2e$13$2e$1$2f$node_modules$2f$pixi$2e$js$2f$lib$2f$rendering$2f$renderers$2f$types$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["RendererType"].WEBGL,
            systems,
            renderPipes,
            renderPipeAdaptors
        };
        super(systemConfig);
    }
}
;
 //# sourceMappingURL=WebGLRenderer.mjs.map
}),
];

//# sourceMappingURL=5703a_pixi_js_lib_b398aa8e._.js.map