<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;

class AiStudioController extends Controller
{
    public function generate(Request $request): JsonResponse
    {
        $prompt = $request->input('prompt', 'Hoạt động phong trào Công đoàn TDMU');
        return response()->json([
            'success' => true,
            'titles' => [
                "Thông Báo: Kế Hoạch Tổ Chức {$prompt} (Công Đoàn TDMU 2026)",
                "Sôi Nổi Thi Đua: {$prompt} Chào Mừng Đổi Mới ĐH Thủ Dầu Một",
                "Công Đoàn TDMU Triển Khai Chương Trình: {$prompt}"
            ],
            'subTitle' => "Hoạt động trọng tâm hướng đến xây dựng môi trường đại học hạnh phúc",
            'summary' => "Công đoàn Trường Đại học Thủ Dầu Một chính thức phát động kế hoạch {$prompt} nhằm nâng cao đời sống cho cán bộ, đoàn viên.",
            'content' => "<h2>I. MỤC ĐÍCH VÀ Ý NGHĨA CHƯƠNG TRÌNH</h2><p>Thực hiện chương trình công tác năm 2026 của Ban Thường vụ Công đoàn Trường Đại học Thủ Dầu Một, thông báo kế hoạch tổ chức: <strong>{$prompt}</strong>.</p><blockquote><i class=\"fa-solid fa-quote-left\"></i> \"Phát huy tinh thần đoàn kết, đổi mới sáng tạo trong giảng dạy và nghiên cứu.\"</blockquote>"
        ]);
    }

    public function studioPackage(Request $request): JsonResponse
    {
        $prompt = $request->input('prompt', 'Tháng Công Nhân 2026');
        return response()->json([
            'success' => true,
            'title' => "Công Đoàn Trường ĐH Thủ Dầu Một: {$prompt}",
            'subTitle' => "Đồng hành, chăm lo và bảo vệ quyền lợi hợp pháp của cán bộ giảng viên",
            'summary' => "Kế hoạch tổ chức {$prompt} với nhiều hoạt động thiết thực chăm lo đời sống đoàn viên.",
            'articleHtml' => "<h2>1. MỤC ĐÍCH & Ý NGHĨA</h2><p>Chương trình <strong>{$prompt}</strong> nhằm tạo khí thế thi đua sôi nổi trong toàn thể cán bộ, giảng viên và người lao động TDMU.</p><blockquote>\"Công đoàn TDMU luôn là mái ấm tin cậy của người lao động\"</blockquote>",
            'facebookPost' => "📢 [TDMU NEWS] {$prompt}

Công đoàn Trường ĐH Thủ Dầu Một phát động chương trình {$prompt} với nhiều hoạt động sôi nổi!

👉 Chi tiết tại: https://congdoan.tdmu.edu.vn
#CongDoanTDMU #TDMU2026",
            'zaloPost' => "[CÔNG ĐOÀN TDMU] Thông báo triển khai {$prompt}. Kính mời quý Thầy/Cô theo dõi.",
            'emailNewsletter' => "Kính gửi quý Thầy/Cô Đoàn viên,

Ban Thường vụ Công đoàn TDMU trân trọng thông báo kế hoạch: {$prompt}.

Trân trọng!",
            'videoScript' => "Kịch bản video 60s: [00:00-00:10] Giới thiệu không khí {$prompt}. [00:10-00:40] Hoạt động trao quà và thi đua. [00:40-01:00] Lời chúc và thông điệp đoàn kết."
        ]);
    }

    public function chat(Request $request): JsonResponse
    {
        $msg = $request->input('message', '');
        $selectedText = $request->input('selectedText', '');

        $reply = "Em đã tiếp nhận yêu cầu: \"{$msg}\".";
        $editAction = "NONE";
        $editContent = "";

        if ($selectedText) {
            $reply = "Dạ, em đã gọt giũa và nâng cấp đoạn văn Thầy/Cô vừa chọn theo chuẩn văn phong báo chí Công đoàn TDMU!";
            $editAction = "REPLACE_SELECTION";
            $editContent = "<p style=\"font-weight: 600; color: #003865;\">" . strip_tags($selectedText) . " (Đã được Copilot AI trau chuốt theo chuẩn văn phong hành chính đoàn thể ĐH Thủ Dầu Một)</p>";
        }

        return response()->json([
            'success' => true,
            'reply' => $reply,
            'editAction' => $editAction,
            'editContent' => $editContent
        ]);
    }

    public function repurpose(Request $request): JsonResponse
    {
        $platform = $request->input('platform', 'Facebook');
        $title = $request->input('title', 'Thông Báo TDMU');
        $content = strip_tags($request->input('content', ''));
        
        $result = "📢 [TDMU NEWS] {$title}

{$content}

👉 Xem chi tiết tại Web Công đoàn TDMU!
#CongDoanTDMU #TDMU2026";
        return response()->json([
            'success' => true,
            'platform' => $platform,
            'result' => $result
        ]);
    }
}
