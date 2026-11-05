package com.csr.participation.service;

import com.csr.activity.entity.Activity;
import com.csr.activity.exception.ActivityNotFoundException;
import com.csr.activity.repository.ActivityRepository;
import com.csr.audit.service.AuditLogService;
import com.csr.auth.entity.User;
import com.csr.common.BusinessException;
import com.csr.participation.dto.FamilyMemberDto;
import com.csr.participation.dto.FamilyMemberJson;
import com.csr.participation.entity.UserActivity;
import com.csr.participation.repository.UserActivityRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 参与人员信息导出（.xlsx）。
 *
 * <p>按活动维度导出全部报名记录：固定列（姓名/用户名/性别/地区/状态/时间/审核人等）
 * + 按活动 formSchema 动态展开的报名字段列（图片字段只输出张数，避免把 base64 塞进单元格）。</p>
 */
@Service
@Transactional(readOnly = true)
public class ParticipationExportService {

    private static final Logger log = LoggerFactory.getLogger(ParticipationExportService.class);

    /** 导出结果：文件名 + 二进制内容 + 记录条数（用于响应头与前端提示） */
    public record ExportFile(String filename, byte[] content, int rowCount) {}

    private static final ZoneId ZONE_ID = ZoneId.of("Asia/Shanghai");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final DateTimeFormatter FILE_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    /** Excel 单元格文本上限 32767，留出余量 */
    private static final int MAX_CELL_TEXT = 32000;
    private static final String SHEET_NAME = "参与人员";

    private static final Map<String, String> STATE_LABELS = Map.of(
        "PENDING", "待审核",
        "APPROVED", "已通过",
        "REJECTED", "已驳回",
        "RE_SUBMITTED", "已重提"
    );

    private static final Map<String, String> RELATION_LABELS = Map.of(
        "SPOUSE", "配偶",
        "CHILD", "子女",
        "PARENT", "父母",
        "OTHER", "其他"
    );

    /** formSchema 中的一个报名字段 */
    private record FormField(String name, String label, String type) {}

    private final UserActivityRepository userActivityRepository;
    private final ActivityRepository activityRepository;
    private final AuditLogService auditLogService;
    private final ObjectMapper objectMapper;

    public ParticipationExportService(UserActivityRepository userActivityRepository,
                                      ActivityRepository activityRepository,
                                      AuditLogService auditLogService,
                                      ObjectMapper objectMapper) {
        this.userActivityRepository = userActivityRepository;
        this.activityRepository = activityRepository;
        this.auditLogService = auditLogService;
        this.objectMapper = objectMapper;
    }

    /**
     * 导出指定活动的全部报名人员信息。
     *
     * @param activityId 活动 ID
     * @return 文件名 + xlsx 内容 + 条数（无报名记录时仍返回仅含表头的文件）
     */
    public ExportFile exportParticipants(Long activityId) {
        Activity activity = activityRepository.findById(activityId)
            .orElseThrow(() -> new ActivityNotFoundException(activityId));

        List<UserActivity> records = userActivityRepository.findAllByActivityIdForExport(activityId);
        List<FormField> formFields = parseFormFields(activity.getFormSchema());

        List<String> headers = new ArrayList<>(List.of(
            "序号", "姓名", "用户名", "性别", "地区", "报名状态", "报名时间"));
        formFields.forEach(field -> headers.add(field.label()));
        headers.addAll(List.of("家属", "审核人", "审核时间", "驳回原因"));

        List<Object[]> rows = new ArrayList<>(records.size());
        int seq = 1;
        for (UserActivity record : records) {
            User user = record.getUser();
            JsonNode formData = parseJson(record.getFormData());

            List<Object> values = new ArrayList<>(headers.size());
            values.add(seq++);
            values.add(displayName(user));
            values.add(user.getUsername());
            values.add(genderLabel(user.getGender()));
            values.add(nullToEmpty(user.getRegion()));
            values.add(STATE_LABELS.getOrDefault(record.getState().name(), record.getState().name()));
            values.add(formatInstant(record.getCreatedAt()));
            for (FormField field : formFields) {
                values.add(formValue(formData, field));
            }
            values.add(familyText(record.getFamilyMembers()));
            values.add(record.getReviewedBy() == null ? "" : displayName(record.getReviewedBy()));
            values.add(formatInstant(record.getReviewedAt()));
            values.add(nullToEmpty(record.getRejectReason()));
            rows.add(values.toArray());
        }

        byte[] content = buildWorkbook(headers, rows);
        String filename = buildFilename(activity.getName());

        auditLogService.log(null, "EXPORT", "ACTIVITY", activityId,
            "导出参与人员信息: " + activity.getName() + "，共 " + records.size() + " 条");
        log.info("导出参与人员信息成功，活动 ID: {}, 名称: {}, 条数: {}",
            activityId, activity.getName(), records.size());

        return new ExportFile(filename, content, records.size());
    }

    // ────────────────────────── 内容组装 ──────────────────────────

    private List<FormField> parseFormFields(String formSchemaJson) {
        JsonNode root = parseJson(formSchemaJson);
        if (root == null) {
            return List.of();
        }
        // 现行约定是 JSON 数组；兼容历史数据的 {"fields": [...]} 结构
        JsonNode fieldsNode = root.isArray() ? root : root.path("fields");
        if (!fieldsNode.isArray()) {
            return List.of();
        }
        List<FormField> fields = new ArrayList<>();
        for (JsonNode node : fieldsNode) {
            String name = node.path("name").asText("");
            if (name.isBlank()) {
                continue;
            }
            String label = node.path("label").asText("");
            String type = node.path("type").asText("text");
            fields.add(new FormField(name, label.isBlank() ? name : label, type));
        }
        return fields;
    }

    private JsonNode parseJson(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readTree(json);
        } catch (Exception e) {
            log.warn("导出时忽略无法解析的 JSON: {}", e.getMessage());
            return null;
        }
    }

    private Object formValue(JsonNode formData, FormField field) {
        if (formData == null || !formData.hasNonNull(field.name())) {
            return "";
        }
        JsonNode value = formData.get(field.name());

        if ("image".equalsIgnoreCase(field.type())) {
            int count = value.isArray() ? value.size() : (value.asText().isBlank() ? 0 : 1);
            return count == 0 ? "" : "已上传 " + count + " 张";
        }
        if (value.isNumber()) {
            return value.asDouble();
        }
        if (value.isArray()) {
            List<String> parts = new ArrayList<>();
            value.forEach(item -> parts.add(item.isValueNode() ? item.asText() : item.toString()));
            return truncate(String.join("、", parts));
        }
        if (value.isObject()) {
            return truncate(value.toString());
        }
        if (value.isBoolean()) {
            return value.asBoolean() ? "是" : "否";
        }
        return truncate(value.asText());
    }

    private String familyText(String familyMembersJson) {
        List<FamilyMemberDto> members = FamilyMemberJson.parse(familyMembersJson);
        if (members.isEmpty()) {
            return "无";
        }
        List<String> parts = new ArrayList<>(members.size());
        for (FamilyMemberDto member : members) {
            String relation = member.relation() == null ? ""
                : RELATION_LABELS.getOrDefault(member.relation().name(), member.relation().name());
            parts.add(relation.isEmpty() ? member.name() : member.name() + "（" + relation + "）");
        }
        return String.join("、", parts);
    }

    private String displayName(User user) {
        if (user == null) {
            return "";
        }
        if (user.getRealName() != null && !user.getRealName().isBlank()) {
            return user.getRealName();
        }
        if (user.getDisplayName() != null && !user.getDisplayName().isBlank()) {
            return user.getDisplayName();
        }
        return user.getUsername();
    }

    private String genderLabel(String gender) {
        if (gender == null || gender.isBlank()) {
            return "";
        }
        String normalized = gender.trim();
        if ("MALE".equalsIgnoreCase(normalized) || "男".equals(normalized)) {
            return "男";
        }
        if ("FEMALE".equalsIgnoreCase(normalized) || "女".equals(normalized)) {
            return "女";
        }
        return normalized;
    }

    private String formatInstant(Instant instant) {
        return instant == null ? "" : DATE_TIME.format(instant.atZone(ZONE_ID));
    }

    private String formatNumber(double value) {
        if (value == Math.floor(value) && !Double.isInfinite(value)) {
            return String.valueOf((long) value);
        }
        return String.valueOf(value);
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private String truncate(String text) {
        if (text == null) {
            return "";
        }
        return text.length() <= MAX_CELL_TEXT ? text : text.substring(0, MAX_CELL_TEXT) + "…";
    }

    private String buildFilename(String activityName) {
        String safeName = (activityName == null ? "活动" : activityName)
            .replaceAll("[\\\\/:*?\"<>|\\r\\n]", "_")
            .trim();
        if (safeName.length() > 60) {
            safeName = safeName.substring(0, 60);
        }
        return "参与人员信息_" + safeName + "_" + FILE_DATE.format(java.time.LocalDate.now(ZONE_ID)) + ".xlsx";
    }

    // ────────────────────────── 工作簿渲染 ──────────────────────────

    private byte[] buildWorkbook(List<String> headers, List<Object[]> rows) {
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet(SHEET_NAME);
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle bodyStyle = createBodyStyle(workbook, false);
            CellStyle numberStyle = createBodyStyle(workbook, true);

            int[] widths = new int[headers.size()];
            Row headerRow = sheet.createRow(0);
            headerRow.setHeightInPoints(26);
            for (int col = 0; col < headers.size(); col++) {
                Cell cell = headerRow.createCell(col);
                cell.setCellValue(headers.get(col));
                cell.setCellStyle(headerStyle);
                widths[col] = displayWidth(headers.get(col)) + 4;
            }

            for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
                Row row = sheet.createRow(rowIndex + 1);
                row.setHeightInPoints(20);
                Object[] values = rows.get(rowIndex);
                for (int col = 0; col < values.length; col++) {
                    Cell cell = row.createCell(col);
                    Object value = values[col];
                    String display;
                    if (value instanceof Number number) {
                        cell.setCellValue(number.doubleValue());
                        cell.setCellStyle(numberStyle);
                        display = formatNumber(number.doubleValue());
                    } else {
                        display = value == null ? "" : value.toString();
                        cell.setCellValue(display);
                        cell.setCellStyle(bodyStyle);
                    }
                    widths[col] = Math.max(widths[col], displayWidth(display) + 2);
                }
            }

            for (int col = 0; col < widths.length; col++) {
                int width = Math.max(8, Math.min(widths[col], 50));
                sheet.setColumnWidth(col, width * 256);
            }

            // 按列宽估算换行行数，避免长文本（地址、留言）只显示一行
            for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
                Object[] values = rows.get(rowIndex);
                int lineCount = 1;
                for (int col = 0; col < values.length; col++) {
                    String display = values[col] instanceof Number number
                        ? formatNumber(number.doubleValue())
                        : (values[col] == null ? "" : values[col].toString());
                    int available = Math.max(6, Math.min(widths[col], 50) - 1);
                    lineCount = Math.max(lineCount, (int) Math.ceil((double) displayWidth(display) / available));
                }
                sheet.getRow(rowIndex + 1).setHeightInPoints(Math.min(120f, Math.max(20f, lineCount * 15f)));
            }

            sheet.createFreezePane(0, 1);
            if (!headers.isEmpty()) {
                sheet.setAutoFilter(new CellRangeAddress(0, Math.max(0, rows.size()), 0, headers.size() - 1));
            }
            sheet.getPrintSetup().setLandscape(true);

            try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                workbook.write(out);
                return out.toByteArray();
            }
        } catch (IOException e) {
            log.error("生成参与人员 Excel 失败", e);
            throw new BusinessException(500, "生成导出文件失败，请稍后重试");
        }
    }

    private CellStyle createHeaderStyle(XSSFWorkbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setFillForegroundColor(new XSSFColor(new byte[]{(byte) 0xFF, 0x2E, (byte) 0xB8, 0x7A}, null));
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBottomBorderColor(IndexedColors.WHITE.getIndex());
        style.setWrapText(true);
        return style;
    }

    private CellStyle createBodyStyle(XSSFWorkbook workbook, boolean numeric) {
        CellStyle style = workbook.createCellStyle();
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setAlignment(numeric ? HorizontalAlignment.RIGHT : HorizontalAlignment.LEFT);
        style.setWrapText(true);
        style.setBorderBottom(BorderStyle.HAIR);
        style.setBottomBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        if (numeric) {
            style.setDataFormat(workbook.createDataFormat().getFormat("0.##"));
        }
        return style;
    }

    /** 计算列宽用的显示宽度：中日韩等全角字符按 2 个字符计 */
    private int displayWidth(String text) {
        if (text == null || text.isEmpty()) {
            return 0;
        }
        int width = 0;
        for (int i = 0; i < text.length(); i++) {
            char ch = text.charAt(i);
            width += (ch >= 0x2E80 || Character.isIdeographic(ch)) ? 2 : 1;
        }
        return width;
    }
}
