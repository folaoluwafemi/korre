import { MeshBuilder, type Mesh, type Scene } from "@babylonjs/core";
import {
  COUNTERBALL_CONFIG_V1,
  type CounterballConfig,
  type TeamId,
} from "@korre/game-protocol";
import { createPitchMaterials } from "./materials.js";

export type GoalFrame = {
  team: TeamId;
  planeZ: number;
  leftPost: Mesh;
  rightPost: Mesh;
  crossbar: Mesh;
};

export type PenaltyBoxMarkings = {
  team: TeamId;
  nearGoalZ: number;
  innerZ: number;
  sideLines: [Mesh, Mesh];
  innerLine: Mesh;
};

export type PitchLayout = {
  ground: Mesh;
  goals: [GoalFrame, GoalFrame];
  penaltyBoxes: [PenaltyBoxMarkings, PenaltyBoxMarkings];
  sideLines: [Mesh, Mesh];
  endLineSegments: [Mesh, Mesh, Mesh, Mesh];
  centerLine: Mesh;
};

const OPEN_CONCRETE_APRON_RATIO = 0.1;

function createSurfaceMarking(
  scene: Scene,
  name: string,
  width: number,
  depth: number,
  x: number,
  z: number,
  surfaceY: number,
  thickness: number,
  material: ReturnType<typeof createPitchMaterials>["marking"],
): Mesh {
  const mesh = MeshBuilder.CreateBox(
    name,
    { width, height: thickness, depth },
    scene,
  );
  mesh.position.set(x, surfaceY + thickness / 2 + 0.002, z);
  mesh.material = material;
  mesh.isPickable = false;
  return mesh;
}

function createGoalFrame(
  scene: Scene,
  team: TeamId,
  planeZ: number,
  goalWidth: number,
  clearHeight: number,
  surfaceY: number,
  frameThickness: number,
  material: ReturnType<typeof createPitchMaterials>["goalFrame"],
): GoalFrame {
  const postX = goalWidth / 2 + frameThickness / 2;
  const postHeight = clearHeight + frameThickness;
  const postCenterY = surfaceY + postHeight / 2;
  const createPost = (side: "left" | "right", x: number): Mesh => {
    const post = MeshBuilder.CreateCylinder(
      `counterball-goal-${team}-${side}-post`,
      {
        diameter: frameThickness,
        height: postHeight,
        tessellation: 16,
      },
      scene,
    );
    post.position.set(x, postCenterY, planeZ);
    post.material = material;
    post.isPickable = false;
    return post;
  };

  const leftPost = createPost("left", -postX);
  const rightPost = createPost("right", postX);
  const crossbar = MeshBuilder.CreateBox(
    `counterball-goal-${team}-crossbar`,
    {
      width: goalWidth + frameThickness,
      height: frameThickness,
      depth: frameThickness,
    },
    scene,
  );
  crossbar.position.set(0, surfaceY + clearHeight + frameThickness / 2, planeZ);
  crossbar.material = material;
  crossbar.isPickable = false;

  return { team, planeZ, leftPost, rightPost, crossbar };
}

function createPenaltyBox(
  scene: Scene,
  team: TeamId,
  nearGoalZ: number,
  directionIntoPitch: -1 | 1,
  boxWidth: number,
  boxDepth: number,
  surfaceY: number,
  markingThickness: number,
  material: ReturnType<typeof createPitchMaterials>["marking"],
): PenaltyBoxMarkings {
  const innerZ = nearGoalZ + directionIntoPitch * boxDepth;
  const centerZ = (nearGoalZ + innerZ) / 2;
  const halfWidth = boxWidth / 2;
  const sideLines: [Mesh, Mesh] = [
    createSurfaceMarking(
      scene,
      `counterball-penalty-${team}-left-side`,
      markingThickness,
      boxDepth,
      -halfWidth,
      centerZ,
      surfaceY,
      markingThickness,
      material,
    ),
    createSurfaceMarking(
      scene,
      `counterball-penalty-${team}-right-side`,
      markingThickness,
      boxDepth,
      halfWidth,
      centerZ,
      surfaceY,
      markingThickness,
      material,
    ),
  ];
  const innerLine = createSurfaceMarking(
    scene,
    `counterball-penalty-${team}-inner-line`,
    boxWidth,
    markingThickness,
    0,
    innerZ,
    surfaceY,
    markingThickness,
    material,
  );

  return { team, nearGoalZ, innerZ, sideLines, innerLine };
}

export function createPitch(
  scene: Scene,
  config: Readonly<CounterballConfig> = COUNTERBALL_CONFIG_V1,
): PitchLayout {
  const { geometry } = config;
  const halfWidth = geometry.pitchWidth / 2;
  const halfLength = geometry.pitchLength / 2;
  const apron =
    Math.max(geometry.pitchWidth, geometry.pitchLength) *
    OPEN_CONCRETE_APRON_RATIO;
  const markingThickness = geometry.capRadius * 0.12;
  const frameThickness = geometry.goalFrameRadius * 2;
  const materials = createPitchMaterials(scene);

  const ground = MeshBuilder.CreateBox(
    "counterball-open-concrete-apron",
    {
      width: geometry.pitchWidth + apron * 2,
      height: geometry.surfaceThickness,
      depth: geometry.pitchLength + apron * 2,
    },
    scene,
  );
  ground.position.y = geometry.surfaceY - geometry.surfaceThickness / 2;
  ground.material = materials.concrete;
  ground.isPickable = false;

  const sideLines: [Mesh, Mesh] = [
    createSurfaceMarking(
      scene,
      "counterball-pitch-side-left",
      markingThickness,
      geometry.pitchLength,
      -halfWidth,
      0,
      geometry.surfaceY,
      markingThickness,
      materials.marking,
    ),
    createSurfaceMarking(
      scene,
      "counterball-pitch-side-right",
      markingThickness,
      geometry.pitchLength,
      halfWidth,
      0,
      geometry.surfaceY,
      markingThickness,
      materials.marking,
    ),
  ];

  const endSegmentWidth = (geometry.pitchWidth - geometry.goalWidth) / 2;
  const endLineSegments = (["home", "away"] as const).flatMap((team) => {
    const endZ = team === "home" ? -halfLength : halfLength;
    const segmentCenterX = geometry.goalWidth / 2 + endSegmentWidth / 2;
    return [-1, 1].map((side) =>
      createSurfaceMarking(
        scene,
        `counterball-pitch-end-${team}-${side < 0 ? "left" : "right"}`,
        endSegmentWidth,
        markingThickness,
        side * segmentCenterX,
        endZ,
        geometry.surfaceY,
        markingThickness,
        materials.marking,
      ),
    );
  }) as [Mesh, Mesh, Mesh, Mesh];

  const centerLine = createSurfaceMarking(
    scene,
    "counterball-pitch-center-line",
    geometry.pitchWidth,
    markingThickness,
    0,
    0,
    geometry.surfaceY,
    markingThickness,
    materials.marking,
  );

  const goals: [GoalFrame, GoalFrame] = [
    createGoalFrame(
      scene,
      "home",
      -halfLength,
      geometry.goalWidth,
      geometry.goalHeight,
      geometry.surfaceY,
      frameThickness,
      materials.goalFrame,
    ),
    createGoalFrame(
      scene,
      "away",
      halfLength,
      geometry.goalWidth,
      geometry.goalHeight,
      geometry.surfaceY,
      frameThickness,
      materials.goalFrame,
    ),
  ];

  const penaltyBoxes: [PenaltyBoxMarkings, PenaltyBoxMarkings] = [
    createPenaltyBox(
      scene,
      "home",
      -halfLength,
      1,
      geometry.penaltyBoxWidth,
      geometry.penaltyBoxDepth,
      geometry.surfaceY,
      markingThickness,
      materials.marking,
    ),
    createPenaltyBox(
      scene,
      "away",
      halfLength,
      -1,
      geometry.penaltyBoxWidth,
      geometry.penaltyBoxDepth,
      geometry.surfaceY,
      markingThickness,
      materials.marking,
    ),
  ];

  return {
    ground,
    goals,
    penaltyBoxes,
    sideLines,
    endLineSegments,
    centerLine,
  };
}
