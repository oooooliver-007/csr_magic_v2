package com.csr.participation.service;

import com.csr.activity.entity.Activity;
import com.csr.activity.exception.ActivityNotFoundException;
import com.csr.activity.repository.ActivityRepository;
import com.csr.audit.service.AuditLogService;
import com.csr.auth.entity.User;
import com.csr.participation.entity.ParticipationState;
import com.csr.participation.entity.UserActivity;
import com.csr.participation.repository.UserActivityRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.ByteArrayInputStream;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ParticipationExportServiceTest {

    @Mock
    private UserActivityRepository userActivityRepository;

    @Mock
    private ActivityRepository activityRepository;

    @Mock
    private AuditLogService auditLogService;

    private ParticipationExportService exportService;

    @BeforeEach
    void setUp() {
        exportService = new ParticipationExportService(
            userActivityRepository, activityRepository, auditLogService, new ObjectMapper());
    }

    @Test
    @DisplayName("导出参与人员：固定列 + 表单字段动态列，图片字段只输出张数")
    void exportParticipants_buildsWorkbook() throws Exception {
        Activity activity = new Activity();
        activity.setId(3L);
        activity.setName("江边净滩/2026");
        activity.setFormSchema("[{\"name\":\"hours\",\"type\":\"number\",\"label\":\"服务时长(小时)\"},"
            + "{\"name\":\"photos\",\"type\":\"image\",\"label\":\"活动照片\"}]");
        when(activityRepository.findById(3L)).thenReturn(Optional.of(activity));

        User user = new User();
        user.setId(23L);
        user.setUsername("jade");
        user.setDisplayName("小明");
        user.setRealName("王小明");
        user.setGender("MALE");
        user.setRegion("上海");

        User admin = new User();
        admin.setId(1L);
        admin.setUsername("admin");
        admin.setDisplayName("管理员");

        UserActivity record = new UserActivity();
        record.setId(101L);
        record.setUser(user);
        record.setActivity(activity);
        record.setState(ParticipationState.APPROVED);
        record.setFormData("{\"hours\":4,\"photos\":[\"data:image/jpeg;base64,AAA\",\"data:image/jpeg;base64,BBB\"]}");
        record.setFamilyMembers("[{\"name\":\"张三\",\"relation\":\"SPOUSE\"}]");
        record.setReviewedBy(admin);
        record.setReviewedAt(Instant.parse("2026-04-15T02:00:00Z"));
        ReflectionTestUtils.setField(record, "createdAt", Instant.parse("2026-04-14T02:00:00Z"));

        when(userActivityRepository.findAllByActivityIdForExport(3L)).thenReturn(List.of(record));

        ParticipationExportService.ExportFile file = exportService.exportParticipants(3L);

        assertEquals(1, file.rowCount());
        assertTrue(file.filename().startsWith("参与人员信息_"));
        assertTrue(file.filename().endsWith(".xlsx"));
        assertFalse(file.filename().contains("/"), "文件名中的路径分隔符应被替换");

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(file.content()))) {
            Sheet sheet = workbook.getSheet("参与人员");
            assertNotNull(sheet);
            assertEquals(List.of("序号", "姓名", "用户名", "性别", "地区", "报名状态", "报名时间",
                    "服务时长(小时)", "活动照片", "家属", "审核人", "审核时间", "驳回原因"),
                headerValues(sheet.getRow(0)));

            Row row = sheet.getRow(1);
            assertEquals(1.0, row.getCell(0).getNumericCellValue());
            assertEquals("王小明", row.getCell(1).getStringCellValue());
            assertEquals("jade", row.getCell(2).getStringCellValue());
            assertEquals("男", row.getCell(3).getStringCellValue());
            assertEquals("上海", row.getCell(4).getStringCellValue());
            assertEquals("已通过", row.getCell(5).getStringCellValue());
            assertEquals("2026-04-14 10:00", row.getCell(6).getStringCellValue());
            assertEquals(4.0, row.getCell(7).getNumericCellValue());
            assertEquals("已上传 2 张", row.getCell(8).getStringCellValue());
            assertEquals("张三（配偶）", row.getCell(9).getStringCellValue());
            assertEquals("管理员", row.getCell(10).getStringCellValue());
            assertEquals("2026-04-15 10:00", row.getCell(11).getStringCellValue());
            assertEquals("", row.getCell(12).getStringCellValue());
        }

        verify(auditLogService).log(isNull(), eq("EXPORT"), eq("ACTIVITY"), eq(3L), contains("共 1 条"));
    }

    @Test
    @DisplayName("导出参与人员：无报名记录时仍返回仅含表头的文件")
    void exportParticipants_emptyActivity() throws Exception {
        Activity activity = new Activity();
        activity.setId(9L);
        activity.setName("空活动");
        when(activityRepository.findById(9L)).thenReturn(Optional.of(activity));
        when(userActivityRepository.findAllByActivityIdForExport(9L)).thenReturn(List.of());

        ParticipationExportService.ExportFile file = exportService.exportParticipants(9L);

        assertEquals(0, file.rowCount());
        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(file.content()))) {
            Sheet sheet = workbook.getSheet("参与人员");
            assertEquals("序号", sheet.getRow(0).getCell(0).getStringCellValue());
            assertNull(sheet.getRow(1), "无数据时不应有数据行");
        }
    }

    @Test
    @DisplayName("导出参与人员：兼容历史 {\"fields\": [...]} 形式的表单 schema")
    void exportParticipants_legacyFormSchema() throws Exception {
        Activity activity = new Activity();
        activity.setId(11L);
        activity.setName("历史活动");
        activity.setFormSchema("{\"fields\":[{\"name\":\"tshirtSize\",\"type\":\"select\",\"label\":\"T恤尺码\"}]}");
        when(activityRepository.findById(11L)).thenReturn(Optional.of(activity));

        User user = new User();
        user.setId(5L);
        user.setUsername("zhangsan");
        user.setDisplayName("测试");

        UserActivity record = new UserActivity();
        record.setId(201L);
        record.setUser(user);
        record.setActivity(activity);
        record.setState(ParticipationState.PENDING);
        record.setFormData("{\"tshirtSize\":\"M\"}");
        ReflectionTestUtils.setField(record, "createdAt", Instant.parse("2026-04-14T02:00:00Z"));
        when(userActivityRepository.findAllByActivityIdForExport(11L)).thenReturn(List.of(record));

        ParticipationExportService.ExportFile file = exportService.exportParticipants(11L);

        try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(file.content()))) {
            Sheet sheet = workbook.getSheet("参与人员");
            List<String> headers = headerValues(sheet.getRow(0));
            int column = headers.indexOf("T恤尺码");
            assertTrue(column > 0, "历史 schema 的字段应作为动态列导出");
            assertEquals("M", sheet.getRow(1).getCell(column).getStringCellValue());
        }
    }

    @Test
    @DisplayName("导出参与人员：活动不存在时抛出 ActivityNotFoundException")
    void exportParticipants_activityNotFound() {
        when(activityRepository.findById(404L)).thenReturn(Optional.empty());

        assertThrows(ActivityNotFoundException.class, () -> exportService.exportParticipants(404L));
        verifyNoInteractions(userActivityRepository);
    }

    private List<String> headerValues(Row headerRow) {
        List<String> values = new ArrayList<>();
        for (int i = 0; i < headerRow.getLastCellNum(); i++) {
            values.add(headerRow.getCell(i).getStringCellValue());
        }
        return values;
    }
}
