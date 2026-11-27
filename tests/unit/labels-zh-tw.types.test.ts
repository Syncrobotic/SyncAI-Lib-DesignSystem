// The zh-TW pack imports no component so a product can install it alone. These checks take the place of the types it
// would otherwise carry: every object must fit the component's own labels type with every key filled, so a key the kit
// adds or renames fails here, before release. Type-only: the assertions compile away, and tsc runs over tests in CI.
import type { AlarmLabels, AlarmList } from "@/registry/syncrobotic/ui/alarm"
import type { AnnotatedImageLabels } from "@/registry/syncrobotic/ui/annotated-image"
import type { AttachmentLabels } from "@/registry/syncrobotic/ui/attachment"
import type { AutocompleteLabels } from "@/registry/syncrobotic/ui/autocomplete"
import type { BreadcrumbLabels } from "@/registry/syncrobotic/ui/breadcrumb"
import type { CameraFeedLabels } from "@/registry/syncrobotic/ui/camera-feed"
import type { CameraWallLabels } from "@/registry/syncrobotic/ui/camera-wall"
import type { ChipGroupLabels } from "@/registry/syncrobotic/ui/chip-group"
import type { FacetsLabels } from "@/registry/syncrobotic/ui/facets"
import type { CodeBlockLabels } from "@/registry/syncrobotic/ui/code-block"
import type { CommandDialogLabels } from "@/registry/syncrobotic/ui/command"
import type { CopyButtonLabels } from "@/registry/syncrobotic/ui/copy-button"
import type { DataGridLabels, DataGridPagination } from "@/registry/syncrobotic/ui/data-grid"
import type { DatePickerLabels } from "@/registry/syncrobotic/ui/date-selector"
import type { DiagnosticsLabels } from "@/registry/syncrobotic/ui/diagnostics"
import type { DialogLabels } from "@/registry/syncrobotic/ui/dialog"
import type { DropdownMenuMoreLabels } from "@/registry/syncrobotic/ui/dropdown-menu"
import type { FilterOperator, FilterViewsLabels, Filters } from "@/registry/syncrobotic/ui/filters"
import type { GraphLabels } from "@/registry/syncrobotic/ui/graph"
import type { GroundedTextLabels } from "@/registry/syncrobotic/ui/grounded-text"
import type { ImageGridLabels } from "@/registry/syncrobotic/ui/image-grid"
import type { JointStateLabels } from "@/registry/syncrobotic/ui/joint-state"
import type { LoadMoreLabels } from "@/registry/syncrobotic/ui/load-more"
import type { LogViewerLabels } from "@/registry/syncrobotic/ui/log-viewer"
import type { WaypointEditorLabels } from "@/registry/syncrobotic/ui/waypoint-editor"
import type { MediaPlayerLabels } from "@/registry/syncrobotic/ui/media-player"
import type { MetricCardLabels } from "@/registry/syncrobotic/ui/metric-card"
import type { NumberField } from "@/registry/syncrobotic/ui/number-field"
import type { Pagination } from "@/registry/syncrobotic/ui/pagination"
import type { PhoneInputLabels } from "@/registry/syncrobotic/ui/phone-input"
import type { PointCloudLabels } from "@/registry/syncrobotic/ui/point-cloud"
import type { QuestionnaireLabels } from "@/registry/syncrobotic/ui/questionnaire"
import type { RobotMapLabels } from "@/registry/syncrobotic/ui/robot-map"
import type { GeoMapLabels } from "@/registry/syncrobotic/ui/geo-map"
import type { RobotModelLabels } from "@/registry/syncrobotic/ui/robot-model"
import type { RouteProgressLabels } from "@/registry/syncrobotic/ui/route-progress"
import type { SearchFieldLabels } from "@/registry/syncrobotic/ui/search-field"
import type { SidebarLabels } from "@/registry/syncrobotic/ui/sidebar"
import type { SortableLabels } from "@/registry/syncrobotic/ui/sortable"
import type { SpinnerLabels } from "@/registry/syncrobotic/ui/spinner"
import type { StreamingChartLabels } from "@/registry/syncrobotic/ui/streaming-chart"
import type { StreamingTextLabels } from "@/registry/syncrobotic/ui/streaming-text"
import type { MessageLabels, MessageMetaLabels } from "@/registry/syncrobotic/ui/message"
import type { MessageActionsLabels } from "@/registry/syncrobotic/ui/message-actions"
import type { PromptComposerLabels } from "@/registry/syncrobotic/ui/prompt-composer"
import type { MessageScrollerLabels } from "@/registry/syncrobotic/ui/message-scroller"
import type { MarkdownLabels } from "@/registry/syncrobotic/ui/markdown"
import type { CitationsLabels } from "@/registry/syncrobotic/ui/citations"
import type { AttitudeIndicatorLabels, GaugeLabels } from "@/registry/syncrobotic/ui/attitude"
import type { ResponsiveTableLabels } from "@/registry/syncrobotic/ui/responsive-table"
import type { TierBadgeLabels } from "@/registry/syncrobotic/ui/tier-badge"
import type { StepperLabels } from "@/registry/syncrobotic/ui/stepper"
import type { TextDiffLabels } from "@/registry/syncrobotic/ui/text-diff"
import type { MeterLabels } from "@/registry/syncrobotic/ui/meter"
import type { BarListLabels } from "@/registry/syncrobotic/ui/bar-list"
import type { ChartViewSwitchLabels } from "@/registry/syncrobotic/ui/segmented-control"
import type { ThumbnailLabels } from "@/registry/syncrobotic/ui/thumbnail"
import type { ThemeChoice } from "@/registry/syncrobotic/ui/theme-toggle"
import type { TimePickerLabels } from "@/registry/syncrobotic/ui/time-picker"
import type { TraceLabels } from "@/registry/syncrobotic/ui/trace"
import type { TreeLabels } from "@/registry/syncrobotic/ui/tree"
import type { IslandAlarm, IslandLabels, IslandNotificationsLabels, IslandRobotsLabels, IslandStatusLabels } from "@/registry/syncrobotic/shell/island"
import type { StopButtonLabels } from "@/registry/syncrobotic/shell/stop-button"
import type { TeleopPadLabels } from "@/registry/syncrobotic/shell/teleop-pad"
import type { TopBarShellLabels } from "@/registry/syncrobotic/blocks/top-bar-shell"
import type { ActionRailShellLabels } from "@/registry/syncrobotic/blocks/action-rail-shell"
import type { ErrorPageLabels, LoadingPageLabels, NoAccessPageLabels, NotFoundPageLabels, OfflinePageLabels } from "@/registry/syncrobotic/blocks/status-pages"
import type { DataStateLabels } from "@/registry/syncrobotic/ui/data-state"
import type { PermissionGateLabels } from "@/registry/syncrobotic/ui/permission-gate"
import type { StepUpDialogLabels } from "@/registry/syncrobotic/ui/step-up-dialog"
import type { DescriptionListLabels } from "@/registry/syncrobotic/ui/description-list"
import type { FreshnessStampLabels } from "@/registry/syncrobotic/ui/freshness-stamp"
import type { EvidencePanelLabels } from "@/registry/syncrobotic/ui/evidence-panel"
import type { DesiredStateLabels } from "@/registry/syncrobotic/ui/desired-state"
import type { HeartbeatStripLabels } from "@/registry/syncrobotic/ui/heartbeat-strip"
import type { FleetTableLabels } from "@/registry/syncrobotic/blocks/fleet-table"
import type { UsersRolesLabels } from "@/registry/syncrobotic/blocks/users-roles"
import type { UsersInvitationsLabels } from "@/registry/syncrobotic/blocks/users-invitations"
import type { UsersAuditLogLabels } from "@/registry/syncrobotic/blocks/users-audit-log"
import type { SettingsApiKeysLabels } from "@/registry/syncrobotic/blocks/settings-api-keys"
import type { SettingsWebhooksLabels } from "@/registry/syncrobotic/blocks/settings-webhooks"
import type { SettingsSessionsLabels } from "@/registry/syncrobotic/blocks/settings-sessions"
import type { NotificationCenterLabels } from "@/registry/syncrobotic/blocks/notification-center"
import type { SettingsPageLabels } from "@/registry/syncrobotic/blocks/settings-page"
import { expect, it } from "vitest"
import * as zh from "@/registry/syncrobotic/lib/labels-zh-tw"

type LabelsOf<C extends (...args: never[]) => unknown> = Parameters<C>[0] extends { labels?: infer L } ? Required<NonNullable<L>> : never
// Exact: no key beyond the type's, so a stale key left behind in the pack is caught too.
type Exact<T, Shape> = T & Record<Exclude<keyof T, keyof Shape>, never>
const fits =
  <Shape,>() =>
  <T extends Shape>(value: Exact<T, Shape>) =>
    value

it("fits every component's labels type", () => {
  fits<AlarmLabels>()(zh.alarmLabels)
  fits<LabelsOf<typeof AlarmList>>()(zh.alarmListLabels)
  fits<LabelsOf<typeof IslandAlarm>>()(zh.islandAlarmLabels)
  fits<StopButtonLabels>()(zh.stopButtonLabels)
  fits<TeleopPadLabels>()(zh.teleopPadLabels)
  fits<IslandLabels>()(zh.islandLabels)
  fits<IslandRobotsLabels>()(zh.islandRobotsLabels)
  fits<IslandStatusLabels>()(zh.islandStatusLabels)
  fits<IslandNotificationsLabels>()(zh.islandNotificationsLabels)
  fits<CameraFeedLabels>()(zh.cameraFeedLabels)
  fits<CameraWallLabels>()(zh.cameraWallLabels)
  fits<CameraFeedLabels>()(zh.cameraFeedStateLineLabels)
  fits<JointStateLabels>()(zh.jointStateLabels)
  fits<StreamingChartLabels>()(zh.streamingChartLabels)
  fits<StreamingTextLabels>()(zh.streamingTextLabels)
  fits<MessageLabels>()(zh.messageLabels)
  fits<MessageMetaLabels>()(zh.messageMetaLabels)
  fits<MessageActionsLabels>()(zh.messageActionsLabels)
  fits<PromptComposerLabels>()(zh.promptComposerLabels)
  fits<MessageScrollerLabels>()(zh.messageScrollerLabels)
  fits<MarkdownLabels>()(zh.markdownLabels)
  fits<CitationsLabels>()(zh.citationsLabels)
  fits<AttitudeIndicatorLabels>()(zh.attitudeIndicatorLabels)
  fits<GaugeLabels>()(zh.gaugeLabels)
  fits<DiagnosticsLabels>()(zh.diagnosticsLabels)
  fits<RobotModelLabels>()(zh.robotModelLabels)
  fits<PointCloudLabels>()(zh.pointCloudLabels)
  fits<RobotMapLabels>()(zh.robotMapLabels)
  fits<RobotMapLabels>()(zh.robotMapListLabels)
  fits<GeoMapLabels>()(zh.geoMapLabels)
  fits<GeoMapLabels>()(zh.geoMapListLabels)
  fits<AnnotatedImageLabels>()(zh.annotatedImageLabels)
  fits<GroundedTextLabels>()(zh.groundedTextLabels)
  fits<GroundedTextLabels>()(zh.groundedTextBodyLabels)
  fits<Pick<AnnotatedImageLabels, "legend" | "previous" | "predicted" | "truth">>()(zh.annotationLegendLabels)
  fits<GraphLabels>()(zh.graphLabels)
  fits<GraphLabels>()(zh.graphListLabels)
  fits<TraceLabels>()(zh.traceLabels)
  fits<TraceLabels>()(zh.traceHeaderLabels)
  fits<MediaPlayerLabels>()(zh.mediaPlayerLabels)
  fits<ImageGridLabels>()(zh.imageGridLabels)
  fits<AttachmentLabels>()(zh.attachmentLabels)
  fits<TierBadgeLabels>()(zh.tierBadgeLabels)
  fits<DataGridLabels>()(zh.dataGridLabels)
  fits<LabelsOf<typeof Pagination>>()(zh.paginationLabels)
  fits<LabelsOf<typeof DataGridPagination>>()(zh.dataGridPaginationLabels)
  fits<LoadMoreLabels>()(zh.loadMoreLabels)
  fits<LogViewerLabels>()(zh.logViewerLabels)
  fits<WaypointEditorLabels>()(zh.waypointEditorLabels)
  fits<MeterLabels>()(zh.meterLabels)
  fits<BarListLabels>()(zh.barListLabels)
  fits<ChartViewSwitchLabels>()(zh.chartViewSwitchLabels)
  fits<ThumbnailLabels>()(zh.thumbnailLabels)
  fits<MetricCardLabels>()(zh.metricCardLabels)
  fits<TextDiffLabels>()(zh.textDiffLabels)
  fits<LabelsOf<typeof Filters>>()(zh.filtersLabels)
  fits<FilterViewsLabels>()(zh.filterViewsLabels)
  fits<SortableLabels>()(zh.sortableLabels)
  fits<TreeLabels>()(zh.treeLabels)
  fits<ChipGroupLabels>()(zh.chipGroupLabels)
  fits<FacetsLabels>()(zh.facetsLabels)
  fits<AutocompleteLabels>()(zh.autocompleteLabels)
  fits<SearchFieldLabels>()(zh.searchFieldLabels)
  fits<DatePickerLabels>()(zh.datePickerLabels)
  fits<DatePickerLabels>()(zh.dateRangePickerLabels)
  fits<TimePickerLabels>()(zh.timePickerLabels)
  fits<LabelsOf<typeof NumberField>>()(zh.numberFieldLabels)
  fits<PhoneInputLabels>()(zh.phoneInputLabels)
  fits<QuestionnaireLabels>()(zh.questionnaireLabels)
  fits<QuestionnaireLabels>()(zh.questionFieldLabels)
  fits<BreadcrumbLabels>()(zh.breadcrumbLabels)
  fits<SidebarLabels>()(zh.sidebarProviderLabels)
  fits<TopBarShellLabels>()(zh.topBarShellLabels)
  fits<ActionRailShellLabels>()(zh.actionRailShellLabels)
  fits<NotFoundPageLabels>()(zh.notFoundPageLabels)
  fits<NoAccessPageLabels>()(zh.noAccessPageLabels)
  fits<ErrorPageLabels>()(zh.errorPageLabels)
  fits<OfflinePageLabels>()(zh.offlinePageLabels)
  fits<LoadingPageLabels>()(zh.loadingPageLabels)
  fits<CommandDialogLabels>()(zh.commandDialogLabels)
  fits<DialogLabels>()(zh.dialogContentLabels)
  fits<DropdownMenuMoreLabels>()(zh.dropdownMenuMoreTriggerLabels)
  fits<ResponsiveTableLabels>()(zh.responsiveTableLabels)
  fits<StepperLabels>()(zh.stepperLabels)
  fits<StepperLabels>()(zh.stepperCompactLabels)
  fits<SpinnerLabels>()(zh.spinnerLabels)
  fits<RouteProgressLabels>()(zh.routeProgressLabels)
  fits<CodeBlockLabels>()(zh.codeBlockLabels)
  fits<CopyButtonLabels>()(zh.copyButtonLabels)
  fits<Record<ThemeChoice, string>>()(zh.themeToggleLabels)
  fits<Record<FilterOperator, string>>()(zh.filtersLabels.operators)
  fits<DataStateLabels>()(zh.dataStateLabels)
  fits<PermissionGateLabels>()(zh.permissionGateLabels)
  fits<StepUpDialogLabels>()(zh.stepUpDialogLabels)
  fits<DescriptionListLabels>()(zh.descriptionListLabels)
  fits<FreshnessStampLabels>()(zh.freshnessStampLabels)
  fits<EvidencePanelLabels>()(zh.evidencePanelLabels)
  fits<DesiredStateLabels>()(zh.desiredStateLabels)
  fits<HeartbeatStripLabels>()(zh.heartbeatStripLabels)
  fits<Required<FleetTableLabels>>()(zh.fleetTableLabels)
  fits<Required<UsersRolesLabels>>()(zh.usersRolesLabels)
  fits<Required<UsersInvitationsLabels>>()(zh.usersInvitationsLabels)
  fits<Required<UsersAuditLogLabels>>()(zh.usersAuditLogLabels)
  fits<Required<SettingsApiKeysLabels>>()(zh.settingsApiKeysLabels)
  fits<Required<SettingsWebhooksLabels>>()(zh.settingsWebhooksLabels)
  fits<Required<SettingsSessionsLabels>>()(zh.settingsSessionsLabels)
  fits<Required<NotificationCenterLabels>>()(zh.notificationCenterLabels)
  fits<Required<SettingsPageLabels>>()(zh.settingsPageLabels)
  expect(zh.locale).toBe("zh-TW")
})
