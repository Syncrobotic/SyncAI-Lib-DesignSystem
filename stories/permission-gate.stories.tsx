import type { Meta, StoryObj } from "@storybook/react-vite"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { permissionGateLabels } from "@/registry/syncrobotic/lib/labels-zh-tw"
import { Button } from "@/registry/syncrobotic/ui/button"
import { Card } from "@/registry/syncrobotic/ui/card"
import { DescriptionList } from "@/registry/syncrobotic/ui/description-list"
import { Field } from "@/registry/syncrobotic/ui/field"
import { Input } from "@/registry/syncrobotic/ui/input"
import { PermissionGate, permissionsFrom } from "@/registry/syncrobotic/ui/permission-gate"
import { SectionHeader } from "@/registry/syncrobotic/ui/section-header"

const meta: Meta = { title: "Feedback/Permission gate" }
export default meta
type S = StoryObj

// A project Member: reads and adds devices, cannot remove them or change the project. The session carries the strings.
const can = permissionsFrom(["devices:read", "devices:create", "project:read"])

/** Disabled with a reason: the Member could be given the permission, so the action stays in view and says why it is off. Hover, focus or tap it. */
export const PermissionGateDisabled: S = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <PermissionGate can={can} permission="devices:create" mode="disabled" reason="Adding devices needs the devices:create permission.">
        <Button>
          <Plus aria-hidden="true" />
          Add device
        </Button>
      </PermissionGate>
      <PermissionGate can={can} permission="devices:delete" mode="disabled" reason="Only a project admin or owner can remove devices.">
        <Button variant="destructive">
          <Trash2 aria-hidden="true" />
          Remove device
        </Button>
      </PermissionGate>
    </div>
  ),
}

/** Hidden: an action this viewer will never have in this place (a platform admin's tool on a project page). Nothing takes its place. */
export const PermissionGateHidden: S = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary">
        <Pencil aria-hidden="true" />
        Rename device
      </Button>
      <PermissionGate can={can} permission="admin:devices:transfer">
        <Button variant="secondary">Move to another project</Button>
      </PermissionGate>
    </div>
  ),
}

/** Read-only: the viewer may read the settings but not change them. A function child shows values as text instead of dead fields. */
export const PermissionGateReadOnly: S = {
  render: () => (
    <Card className="w-full max-w-md gap-3">
      <SectionHeader variant="surface" title="Project" />
      <PermissionGate can={can} permission="project:update" mode="read-only" reason="A project admin can change them.">
        {({ readOnly }) =>
          readOnly ? (
            <DescriptionList
              variant="bare"
              columns={2}
              items={[
                { label: "Name", value: "Hsinchu plant" },
                { label: "Device seats", value: "12 of 20" },
              ]}
            />
          ) : (
            <Field label="Name">
              <Input defaultValue="Hsinchu plant" />
            </Field>
          )
        }
      </PermissionGate>
    </Card>
  ),
}

/** Read-only around a plain form: a disabled fieldset, so nothing in it can change. */
export const PermissionGateReadOnlyForm: S = {
  render: () => (
    <Card className="w-full max-w-md gap-3">
      <PermissionGate allowed={false} mode="read-only">
        <div className="flex flex-col gap-4">
          <Field label="Webhook URL">
            <Input defaultValue="https://hooks.example.com/devices" />
          </Field>
          <Button className="self-start">Save</Button>
        </div>
      </PermissionGate>
    </Card>
  ),
}

/** Forbidden: a whole region the viewer may not read. Within the tenant only; a record in another tenant is a not-found page. */
export const PermissionGateForbidden: S = {
  render: () => (
    <Card className="w-full max-w-md">
      <PermissionGate can={can} permission="auditLogs:read" mode="forbidden" reason="The audit log needs the auditLogs:read permission. A project owner can grant it.">
        <p>Audit log</p>
      </PermissionGate>
    </Card>
  ),
}

/** In Traditional Chinese, through `permissionGateLabels`. */
export const PermissionGateZhTw: S = {
  render: () => (
    <Card className="w-full max-w-md">
      <PermissionGate allowed={false} mode="forbidden" labels={permissionGateLabels}>
        <p>稽核紀錄</p>
      </PermissionGate>
    </Card>
  ),
}
