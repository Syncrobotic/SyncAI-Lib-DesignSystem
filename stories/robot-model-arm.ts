// A small six-joint arm, drawn from primitives only (boxes, cylinders and spheres), so the robot model's stories and
// tests fetch nothing. Its frame is ROS's: x forward, y left, z up, in metres and radians. The colours in <material>
// are the URDF's own; the view draws every link in the theme's greys instead.
export const demoArmUrdf = `<?xml version="1.0"?>
<robot name="Demo arm">
  <material name="arm"><color rgba="0.9 0.5 0.1 1"/></material>

  <link name="base_link">
    <visual><origin xyz="0 0 0.03"/><geometry><cylinder radius="0.11" length="0.06"/></geometry><material name="arm"/></visual>
  </link>

  <joint name="shoulder_pan" type="revolute">
    <parent link="base_link"/><child link="shoulder_link"/>
    <origin xyz="0 0 0.06"/><axis xyz="0 0 1"/>
    <limit lower="-3.1416" upper="3.1416" effort="150" velocity="3.14"/>
  </joint>
  <link name="shoulder_link">
    <visual><origin xyz="0 0 0.07"/><geometry><cylinder radius="0.065" length="0.14"/></geometry></visual>
  </link>

  <joint name="shoulder_lift" type="revolute">
    <parent link="shoulder_link"/><child link="upper_arm_link"/>
    <origin xyz="0 0 0.14"/><axis xyz="0 1 0"/>
    <limit lower="-2.0" upper="2.0" effort="150" velocity="3.14"/>
  </joint>
  <link name="upper_arm_link">
    <visual><origin rpy="1.5708 0 0"/><geometry><cylinder radius="0.06" length="0.15"/></geometry></visual>
    <visual><origin xyz="0 0 0.2"/><geometry><box size="0.08 0.08 0.4"/></geometry></visual>
  </link>

  <joint name="elbow" type="revolute">
    <parent link="upper_arm_link"/><child link="forearm_link"/>
    <origin xyz="0 0 0.4"/><axis xyz="0 1 0"/>
    <limit lower="-2.6" upper="2.6" effort="28" velocity="3.14"/>
  </joint>
  <link name="forearm_link">
    <visual><origin rpy="1.5708 0 0"/><geometry><cylinder radius="0.05" length="0.12"/></geometry></visual>
    <visual><origin xyz="0 0 0.17"/><geometry><box size="0.065 0.065 0.34"/></geometry></visual>
  </link>

  <joint name="wrist_1" type="revolute">
    <parent link="forearm_link"/><child link="wrist_1_link"/>
    <origin xyz="0 0 0.34"/><axis xyz="0 1 0"/>
    <limit lower="-3.1416" upper="3.1416" effort="12" velocity="6.28"/>
  </joint>
  <link name="wrist_1_link">
    <visual><origin rpy="1.5708 0 0"/><geometry><cylinder radius="0.042" length="0.1"/></geometry></visual>
    <visual><origin xyz="0 0 0.04"/><geometry><cylinder radius="0.035" length="0.08"/></geometry></visual>
  </link>

  <joint name="wrist_2" type="revolute">
    <parent link="wrist_1_link"/><child link="wrist_2_link"/>
    <origin xyz="0 0 0.08"/><axis xyz="0 0 1"/>
    <limit lower="-2.8" upper="2.8" effort="12" velocity="6.28"/>
  </joint>
  <link name="wrist_2_link">
    <visual><origin xyz="0 0 0.035"/><geometry><box size="0.07 0.05 0.07"/></geometry></visual>
  </link>

  <joint name="wrist_3" type="revolute">
    <parent link="wrist_2_link"/><child link="wrist_3_link"/>
    <origin xyz="0 0 0.07"/><axis xyz="0 1 0"/>
    <limit lower="-3.1416" upper="3.1416" effort="12" velocity="6.28"/>
  </joint>
  <link name="wrist_3_link">
    <visual><origin rpy="1.5708 0 0"/><geometry><cylinder radius="0.038" length="0.08"/></geometry></visual>
    <visual><origin xyz="0 0 0.05"/><geometry><sphere radius="0.03"/></geometry></visual>
  </link>

  <joint name="tool_mount" type="fixed">
    <parent link="wrist_3_link"/><child link="gripper_link"/>
    <origin xyz="0 0 0.08"/>
  </joint>
  <link name="gripper_link">
    <visual><geometry><box size="0.1 0.03 0.02"/></geometry></visual>
    <visual><origin xyz="0.04 0 0.04"/><geometry><box size="0.015 0.025 0.07"/></geometry></visual>
    <visual><origin xyz="-0.04 0 0.04"/><geometry><box size="0.015 0.025 0.07"/></geometry></visual>
  </link>
</robot>
`

/** The arm reaching forward and down, as if over a table: the pose the stories start from. */
export const demoArmPose: Record<string, number> = {
  shoulder_pan: 0.35,
  shoulder_lift: 0.55,
  elbow: 1.1,
  wrist_1: 0.9,
  wrist_2: 0.4,
  wrist_3: 0,
}
