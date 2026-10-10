import { Color3, RawTexture, StandardMaterial, Texture } from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";

const CONCRETE_TEXTURE_SIZE = 128;

export type PitchMaterials = {
  concrete: StandardMaterial;
  marking: StandardMaterial;
  goalFrame: StandardMaterial;
};

function createConcreteGrain(scene: Scene): RawTexture {
  const pixels = new Uint8Array(
    CONCRETE_TEXTURE_SIZE * CONCRETE_TEXTURE_SIZE * 4,
  );
  let seed = 0x434f554e;

  const random = (): number => {
    seed = (Math.imul(seed, 1_664_525) + 1_013_904_223) >>> 0;
    return seed / 0x1_0000_0000;
  };

  for (let pixel = 0; pixel < CONCRETE_TEXTURE_SIZE ** 2; pixel += 1) {
    const offset = pixel * 4;
    const fineGrain = Math.round((random() - 0.5) * 14);
    const aggregate = random() < 0.055 ? (random() < 0.5 ? -11 : 8) : 0;
    pixels[offset] = 69 + fineGrain + aggregate;
    pixels[offset + 1] = 145 + fineGrain + aggregate;
    pixels[offset + 2] = 77 + Math.round(fineGrain * 0.7) + aggregate;
    pixels[offset + 3] = 255;
  }

  const texture = RawTexture.CreateRGBATexture(
    pixels,
    CONCRETE_TEXTURE_SIZE,
    CONCRETE_TEXTURE_SIZE,
    scene,
    true,
    false,
    Texture.BILINEAR_SAMPLINGMODE,
  );
  texture.name = "counterball-green-concrete-grain";
  texture.wrapU = Texture.WRAP_ADDRESSMODE;
  texture.wrapV = Texture.WRAP_ADDRESSMODE;
  return texture;
}

export function createPitchMaterials(scene: Scene): PitchMaterials {
  const concrete = new StandardMaterial("counterball-concrete", scene);
  concrete.diffuseTexture = createConcreteGrain(scene);
  concrete.diffuseColor = Color3.White();
  concrete.specularColor = new Color3(0.055, 0.07, 0.055);
  concrete.specularPower = 10;

  const marking = new StandardMaterial("counterball-pitch-markings", scene);
  marking.diffuseColor = new Color3(0.93, 0.94, 0.83);
  marking.emissiveColor = new Color3(0.045, 0.047, 0.032);
  marking.specularColor = Color3.Black();

  const goalFrame = new StandardMaterial("counterball-goal-frame", scene);
  goalFrame.diffuseColor = new Color3(0.95, 0.88, 0.69);
  goalFrame.specularColor = new Color3(0.12, 0.1, 0.075);
  goalFrame.specularPower = 18;

  return { concrete, marking, goalFrame };
}
