import {
  Color3,
  Mesh,
  MeshBuilder,
  Quaternion,
  StandardMaterial,
  TransformNode,
  VertexData,
  type Scene,
} from "@babylonjs/core";
import {
  COUNTERBALL_CONFIG_V1,
  ENTITY_IDS,
  type BodyState,
  type CapEntityId,
  type CounterballConfig,
  type EntityId,
  type TeamId,
} from "@korre/game-protocol";

export type ButtonHole = {
  /** Local pitch-plane x coordinate from the button body's center. */
  x: number;
  /** Local pitch-plane z coordinate from the button body's center. */
  z: number;
  radius: number;
};

export type ButtonAssembly = {
  kind: "button";
  id: "button";
  root: TransformNode;
  bodyMesh: Mesh;
  detailMeshes: Mesh[];
  holes: [ButtonHole, ButtonHole, ButtonHole, ButtonHole];
};

export type CapAssembly = {
  kind: "cap";
  id: CapEntityId;
  team: TeamId;
  /** The team cue is geometric as well as chromatic. */
  teamCue: "three-stripe" | "rosette";
  root: TransformNode;
  bodyMesh: Mesh;
  detailMeshes: Mesh[];
};

export type PieceAssembly = ButtonAssembly | CapAssembly;

type PieceMaterials = {
  button: StandardMaterial;
  homeCap: StandardMaterial;
  awayCap: StandardMaterial;
  detail: StandardMaterial;
  buttonRim: StandardMaterial;
};

function createPieceMaterials(scene: Scene): PieceMaterials {
  const button = new StandardMaterial("counterball-button-plastic", scene);
  button.diffuseColor = new Color3(0.91, 0.87, 0.73);
  button.specularColor = new Color3(0.48, 0.44, 0.34);
  button.specularPower = 64;

  const homeCap = new StandardMaterial("counterball-home-cap-metal", scene);
  homeCap.diffuseColor = new Color3(0.08, 0.38, 0.41);
  homeCap.specularColor = new Color3(0.58, 0.63, 0.57);
  homeCap.specularPower = 52;

  const awayCap = new StandardMaterial("counterball-away-cap-enamel", scene);
  awayCap.diffuseColor = new Color3(0.78, 0.28, 0.13);
  awayCap.specularColor = new Color3(0.36, 0.28, 0.2);
  awayCap.specularPower = 30;

  const detail = new StandardMaterial("counterball-cap-embossing", scene);
  detail.diffuseColor = new Color3(0.91, 0.83, 0.62);
  detail.specularColor = new Color3(0.28, 0.25, 0.2);
  detail.specularPower = 36;

  const buttonRim = new StandardMaterial(
    "counterball-button-hole-bevel",
    scene,
  );
  buttonRim.diffuseColor = new Color3(0.75, 0.71, 0.59);
  buttonRim.specularColor = new Color3(0.5, 0.47, 0.37);
  buttonRim.specularPower = 60;

  return { button, homeCap, awayCap, detail, buttonRim };
}

function createPieceRoot(scene: Scene, body: BodyState): TransformNode {
  const root = new TransformNode(`counterball-piece-${body.id}`, scene);
  root.position.set(body.position.x, body.position.y, body.position.z);
  root.rotationQuaternion = new Quaternion(
    body.rotation.x,
    body.rotation.y,
    body.rotation.z,
    body.rotation.w,
  );
  root.metadata = { entityId: body.id };
  return root;
}

function parentMesh(
  mesh: Mesh,
  root: TransformNode,
  material: StandardMaterial,
  isPickable = false,
): Mesh {
  mesh.parent = root;
  mesh.material = material;
  mesh.isPickable = isPickable;
  return mesh;
}

function createTorus(
  scene: Scene,
  name: string,
  diameter: number,
  thickness: number,
  root: TransformNode,
  material: StandardMaterial,
  x: number,
  y: number,
  z: number,
): Mesh {
  const mesh = MeshBuilder.CreateTorus(
    name,
    { diameter, thickness, tessellation: 28 },
    scene,
  );
  mesh.position.set(x, y, z);
  return parentMesh(mesh, root, material);
}

function createPerforatedButtonBody(
  scene: Scene,
  radius: number,
  thickness: number,
  holes: readonly ButtonHole[],
): Mesh {
  // Build a fine, closed cell surface directly so the four button holes are
  // real openings without relying on Babylon's optional global Earcut hook.
  const resolution = 128;
  const step = (radius * 2) / resolution;
  const halfThickness = thickness / 2;
  const validCells = new Uint8Array(resolution * resolution);
  const isInsideButton = (x: number, z: number): boolean =>
    x * x + z * z <= radius * radius;
  const intersectsHole = (
    minX: number,
    maxX: number,
    minZ: number,
    maxZ: number,
    hole: ButtonHole,
  ): boolean => {
    const closestX = Math.max(minX, Math.min(hole.x, maxX));
    const closestZ = Math.max(minZ, Math.min(hole.z, maxZ));
    const deltaX = closestX - hole.x;
    const deltaZ = closestZ - hole.z;
    return deltaX * deltaX + deltaZ * deltaZ < hole.radius * hole.radius;
  };

  const cellIsValid = (column: number, row: number): boolean => {
    const minX = -radius + column * step;
    const maxX = minX + step;
    const minZ = -radius + row * step;
    const maxZ = minZ + step;
    if (
      !isInsideButton(minX, minZ) ||
      !isInsideButton(maxX, minZ) ||
      !isInsideButton(maxX, maxZ) ||
      !isInsideButton(minX, maxZ)
    ) {
      return false;
    }
    return !holes.some((hole) => intersectsHole(minX, maxX, minZ, maxZ, hole));
  };

  for (let row = 0; row < resolution; row += 1) {
    for (let column = 0; column < resolution; column += 1) {
      if (cellIsValid(column, row)) {
        validCells[row * resolution + column] = 1;
      }
    }
  }

  const positions: number[] = [];
  const indices: number[] = [];
  const addQuad = (
    a: readonly [number, number, number],
    b: readonly [number, number, number],
    c: readonly [number, number, number],
    d: readonly [number, number, number],
  ): void => {
    const base = positions.length / 3;
    positions.push(...a, ...b, ...c, ...d);
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  const hasCell = (column: number, row: number): boolean =>
    column >= 0 &&
    column < resolution &&
    row >= 0 &&
    row < resolution &&
    validCells[row * resolution + column] === 1;

  for (let row = 0; row < resolution; row += 1) {
    for (let column = 0; column < resolution; column += 1) {
      if (!hasCell(column, row)) continue;
      const minX = -radius + column * step;
      const maxX = minX + step;
      const minZ = -radius + row * step;
      const maxZ = minZ + step;
      const p00 = [minX, halfThickness, minZ] as const;
      const p10 = [maxX, halfThickness, minZ] as const;
      const p11 = [maxX, halfThickness, maxZ] as const;
      const p01 = [minX, halfThickness, maxZ] as const;
      const b00 = [minX, -halfThickness, minZ] as const;
      const b10 = [maxX, -halfThickness, minZ] as const;
      const b11 = [maxX, -halfThickness, maxZ] as const;
      const b01 = [minX, -halfThickness, maxZ] as const;

      // On the XZ pitch plane these orders give the top and bottom their
      // outward-facing normals, respectively.
      addQuad(p00, p01, p11, p10);
      addQuad(b00, b10, b11, b01);

      if (!hasCell(column - 1, row)) {
        addQuad(p00, b00, b01, p01);
      }
      if (!hasCell(column + 1, row)) {
        addQuad(p10, p11, b11, b10);
      }
      if (!hasCell(column, row - 1)) {
        addQuad(p00, p10, b10, b00);
      }
      if (!hasCell(column, row + 1)) {
        addQuad(p01, b01, b11, p11);
      }
    }
  }

  const bodyMesh = new Mesh("counterball-button-perforated-body", scene);
  const normals: number[] = [];
  VertexData.ComputeNormals(positions, indices, normals);
  const vertexData = new VertexData();
  vertexData.positions = positions;
  vertexData.indices = indices;
  vertexData.normals = normals;
  vertexData.applyToMesh(bodyMesh, false);
  return bodyMesh;
}

function createButton(
  scene: Scene,
  body: BodyState,
  config: Readonly<CounterballConfig>,
  materials: PieceMaterials,
): ButtonAssembly {
  const { buttonRadius, buttonThickness } = config.geometry;
  const root = createPieceRoot(scene, body);
  const holeRadius = buttonRadius * 0.23;
  const holeOffset = buttonRadius * 0.42;
  const holes: [ButtonHole, ButtonHole, ButtonHole, ButtonHole] = [
    { x: -holeOffset, z: -holeOffset, radius: holeRadius },
    { x: holeOffset, z: -holeOffset, radius: holeRadius },
    { x: -holeOffset, z: holeOffset, radius: holeRadius },
    { x: holeOffset, z: holeOffset, radius: holeRadius },
  ];
  const bodyMesh = createPerforatedButtonBody(
    scene,
    buttonRadius,
    buttonThickness,
    holes,
  );
  materials.button.backFaceCulling = false;
  parentMesh(bodyMesh, root, materials.button, true);

  const rimThickness = buttonRadius * 0.08;
  const detailMeshes = [
    createTorus(
      scene,
      "counterball-button-outer-rim",
      buttonRadius * 2 - rimThickness,
      rimThickness,
      root,
      materials.buttonRim,
      0,
      buttonThickness / 2 - rimThickness / 4,
      0,
    ),
  ];

  holes.forEach((hole, index) => {
    const bevelThickness = hole.radius * 0.14;
    detailMeshes.push(
      createTorus(
        scene,
        `counterball-button-hole-bevel-${index + 1}`,
        hole.radius * 1.8,
        bevelThickness,
        root,
        materials.buttonRim,
        hole.x,
        buttonThickness / 2 - bevelThickness / 4,
        hole.z,
      ),
    );
  });

  return { kind: "button", id: "button", root, bodyMesh, detailMeshes, holes };
}

function createCap(
  scene: Scene,
  body: BodyState & { id: CapEntityId },
  config: Readonly<CounterballConfig>,
  materials: PieceMaterials,
): CapAssembly {
  const team: TeamId = body.id.startsWith("home-") ? "home" : "away";
  const teamCue = team === "home" ? "three-stripe" : "rosette";
  const capMaterial = team === "home" ? materials.homeCap : materials.awayCap;
  const { capRadius, capHeight } = config.geometry;
  const root = createPieceRoot(scene, body);
  const bodyMesh = MeshBuilder.CreateCylinder(
    `counterball-cap-${body.id}-shell`,
    {
      diameter: capRadius * 2,
      height: capHeight,
      tessellation: 28,
    },
    scene,
  );
  parentMesh(bodyMesh, root, capMaterial, true);

  const detailMeshes: Mesh[] = [];
  const lidHeight = capHeight * 0.08;
  const lid = MeshBuilder.CreateCylinder(
    `counterball-cap-${body.id}-lid`,
    {
      diameter: capRadius * 1.72,
      height: lidHeight,
      tessellation: 28,
    },
    scene,
  );
  lid.position.y = capHeight / 2 - lidHeight / 2;
  detailMeshes.push(parentMesh(lid, root, capMaterial));

  const rimThickness = capRadius * 0.05;
  detailMeshes.push(
    createTorus(
      scene,
      `counterball-cap-${body.id}-crown-rim`,
      capRadius * 1.88,
      rimThickness,
      root,
      materials.detail,
      0,
      capHeight / 2 + rimThickness / 4,
      0,
    ),
  );

  if (teamCue === "three-stripe") {
    const stripeWidth = capRadius * 1.38;
    const stripeDepth = capRadius * 0.1;
    const stripeHeight = capHeight * 0.09;
    const stripeSpacing = capRadius * 0.31;
    for (let index = -1; index <= 1; index += 1) {
      const stripe = MeshBuilder.CreateBox(
        `counterball-cap-${body.id}-rib-${index + 2}`,
        {
          width: stripeWidth,
          height: stripeHeight,
          depth: stripeDepth,
        },
        scene,
      );
      stripe.position.set(
        0,
        capHeight / 2 + stripeHeight / 2,
        index * stripeSpacing,
      );
      detailMeshes.push(parentMesh(stripe, root, materials.detail));
    }
  } else {
    const medallionDiameter = capRadius * 0.68;
    const medallionHeight = capHeight * 0.1;
    const medallion = MeshBuilder.CreateCylinder(
      `counterball-cap-${body.id}-medallion`,
      {
        diameter: medallionDiameter,
        height: medallionHeight,
        tessellation: 24,
      },
      scene,
    );
    medallion.position.y = capHeight / 2 + medallionHeight / 2;
    detailMeshes.push(parentMesh(medallion, root, materials.detail));

    detailMeshes.push(
      createTorus(
        scene,
        `counterball-cap-${body.id}-medallion-ring`,
        capRadius * 0.42,
        capRadius * 0.055,
        root,
        materials.homeCap,
        0,
        capHeight / 2 + medallionHeight,
        0,
      ),
    );

    const dotOffset = capRadius * 0.5;
    const dotDiameter = capRadius * 0.09;
    const dotHeight = capHeight * 0.07;
    const dotPositions = [
      [0, -dotOffset],
      [dotOffset, 0],
      [0, dotOffset],
      [-dotOffset, 0],
    ] as const;
    dotPositions.forEach(([x, z], index) => {
      const dot = MeshBuilder.CreateCylinder(
        `counterball-cap-${body.id}-rosette-dot-${index + 1}`,
        {
          diameter: dotDiameter,
          height: dotHeight,
          tessellation: 12,
        },
        scene,
      );
      dot.position.set(x, capHeight / 2 + dotHeight / 2, z);
      detailMeshes.push(parentMesh(dot, root, materials.homeCap));
    });
  }

  return {
    kind: "cap",
    id: body.id,
    team,
    teamCue,
    root,
    bodyMesh,
    detailMeshes,
  };
}

function isCapBody(body: BodyState): body is BodyState & { id: CapEntityId } {
  return body.id !== "button";
}

function assertCanonicalBodies(bodies: readonly BodyState[]): void {
  const expected = new Set<EntityId>(ENTITY_IDS);
  const actual = new Set(bodies.map((body) => body.id));
  if (
    bodies.length !== expected.size ||
    actual.size !== expected.size ||
    [...expected].some((id) => !actual.has(id))
  ) {
    throw new TypeError(
      "Piece rendering requires one body for each of the 15 canonical entity IDs.",
    );
  }
}

/** Builds render-only pieces from the canonical snapshot; it does not move or adjudicate them. */
export function createPieces(
  scene: Scene,
  bodies: readonly BodyState[],
  config: Readonly<CounterballConfig> = COUNTERBALL_CONFIG_V1,
): PieceAssembly[] {
  assertCanonicalBodies(bodies);
  const materials = createPieceMaterials(scene);
  return bodies.map((body) => {
    if (body.id === "button") {
      return createButton(scene, body, config, materials);
    }
    if (!isCapBody(body)) {
      throw new TypeError("Rendered cap IDs must belong to home or away.");
    }
    return createCap(scene, body, config, materials);
  });
}
