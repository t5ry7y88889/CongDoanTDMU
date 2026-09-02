<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ArticleController extends Controller
{
    private function loadDB()
    {
        $path = base_path("server/database.json");
        if (!file_exists($path)) {
            return ["articles" => [], "users" => [], "to_chuc" => [], "to_cong_doan" => [], "nhan_su" => [], "tin_tuc" => [], "van_ban" => [], "bao_cao_thang" => [], "schedules" => [], "audits" => []];
        }
        return json_decode(file_get_contents($path), true) ?: [];
    }

    private function saveDB($db)
    {
        $path = base_path("server/database.json");
        file_put_contents($path, json_encode($db, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    // GET /api/articles
    public function index(Request $req): JsonResponse
    {
        $db = $this->loadDB();
        $articles = $db["articles"] ?? ($db["tin_tuc"] ?? []);
        $category = $req->query('category', 'all');
        $status = $req->query('status', 'all');
        $search = strtolower($req->query('search', ''));

        if ($category !== 'all') {
            $articles = array_filter($articles, fn($a) => ($a['categoryName'] ?? ($a['ChuyenMuc'] ?? '')) == $category);
        }
        if ($status !== 'all') {
            $articles = array_filter($articles, fn($a) => ($a['status'] ?? ($a['TrangThai'] ?? '')) == $status);
        }
        if ($search) {
            $articles = array_filter($articles, function($a) use ($search) {
                $title = strtolower($a['title'] ?? ($a['TieuDe'] ?? ''));
                $summary = strtolower($a['summary'] ?? ($a['TomTat'] ?? ''));
                return str_contains($title, $search) || str_contains($summary, $search);
            });
        }

        return response()->json([
            "success" => true,
            "count"   => count($articles),
            "data"    => array_values($articles),
        ]);
    }

    // GET /api/articles/{id}
    public function show($id): JsonResponse
    {
        $db = $this->loadDB();
        $articles = $db["articles"] ?? ($db["tin_tuc"] ?? []);
        foreach ($articles as $art) {
            if (($art["id"] ?? ($art["MaTinTuc"] ?? null)) == $id) {
                return response()->json(["success" => true, "data" => $art]);
            }
        }
        return response()->json(["success" => false, "message" => "Không tìm thấy bài viết"], 404);
    }

    // POST /api/articles
    public function store(Request $req): JsonResponse
    {
        $db = $this->loadDB();
        $title = $req->input("title", $req->input("TieuDe", "Bài viết mới"));
        $articles = $db["articles"] ?? [];
        $newId = count($articles) + 1;
        $newArticle = [
            "id" => $newId,
            "MaTinTuc" => $newId,
            "title" => $title,
            "TieuDe" => $title,
            "categoryName" => $req->input("categoryName", $req->input("ChuyenMuc", "Thông Báo Chỉ Đạo")),
            "ChuyenMuc" => $req->input("ChuyenMuc", $req->input("categoryName", "Thông Báo Chỉ Đạo")),
            "summary" => $req->input("summary", $req->input("TomTat", $title)),
            "content" => $req->input("content", $req->input("NoiDung", $title)),
            "author" => $req->input("author", $req->input("TacGia", "Cán Bộ Công Đoàn")),
            "status" => $req->input("status", "draft"),
            "TrangThai" => $req->input("status", "draft") === "published" ? "Published" : "Draft",
            "createdAt" => date("Y-m-d H:i"),
            "viewsCount" => 0,
            "likesCount" => 0,
            "isAiGenerated" => $req->input("isAiGenerated", false)
        ];
        $db["articles"][] = $newArticle;
        $this->saveDB($db);

        return response()->json(["success" => true, "data" => $newArticle], 201);
    }

    // PUT /api/articles/{id}
    public function update(Request $req, $id): JsonResponse
    {
        $db = $this->loadDB();
        $found = false;
        if (isset($db["articles"])) {
            foreach ($db["articles"] as &$art) {
                if (($art["id"] ?? ($art["MaTinTuc"] ?? null)) == $id) {
                    foreach ($req->all() as $key => $val) {
                        $art[$key] = $val;
                    }
                    $found = true;
                    break;
                }
            }
        }
        if ($found) {
            $this->saveDB($db);
            return response()->json(["success" => true, "message" => "Đã cập nhật thành công"]);
        }
        return response()->json(["success" => false, "message" => "Không tìm thấy"], 404);
    }

    // DELETE /api/articles/{id}
    public function destroy($id): JsonResponse
    {
        $db = $this->loadDB();
        $initialCount = count($db["articles"] ?? []);
        $db["articles"] = array_values(array_filter($db["articles"] ?? [], fn($a) => ($a["id"] ?? ($a["MaTinTuc"] ?? null)) != $id));
        if (count($db["articles"]) < $initialCount) {
            $this->saveDB($db);
            return response()->json(["success" => true, "message" => "Đã xóa thành công"]);
        }
        return response()->json(["success" => false, "message" => "Không tìm thấy"], 404);
    }

    // POST /api/articles/{id}/approve
    public function approve($id): JsonResponse
    {
        $db = $this->loadDB();
        foreach ($db["articles"] as &$art) {
            if (($art["id"] ?? ($art["MaTinTuc"] ?? null)) == $id) {
                $art["status"] = "approved";
                $art["statusName"] = "Đã Duyệt";
                $art["TrangThai"] = "Approved";
                $this->saveDB($db);
                return response()->json(["success" => true, "message" => "Đã duyệt bài viết thành công"]);
            }
        }
        return response()->json(["success" => false, "message" => "Không tìm thấy"], 404);
    }

    // POST /api/articles/{id}/reject
    public function reject($id): JsonResponse
    {
        $db = $this->loadDB();
        foreach ($db["articles"] as &$art) {
            if (($art["id"] ?? ($art["MaTinTuc"] ?? null)) == $id) {
                $art["status"] = "rejected";
                $art["statusName"] = "Từ Chối";
                $art["TrangThai"] = "Rejected";
                $this->saveDB($db);
                return response()->json(["success" => true, "message" => "Đã từ chối bài viết"]);
            }
        }
        return response()->json(["success" => false, "message" => "Không tìm thấy"], 404);
    }

    // POST /api/articles/{id}/submit
    public function submit($id): JsonResponse
    {
        $db = $this->loadDB();
        foreach ($db["articles"] as &$art) {
            if (($art["id"] ?? ($art["MaTinTuc"] ?? null)) == $id) {
                $art["status"] = "pending";
                $art["statusName"] = "Chờ Duyệt";
                $art["TrangThai"] = "Pending";
                $this->saveDB($db);
                return response()->json(["success" => true, "message" => "Đã gửi bài viết chờ BCH duyệt"]);
            }
        }
        return response()->json(["success" => false, "message" => "Không tìm thấy"], 404);
    }

    // GET /api/users
    public function users(): JsonResponse
    {
        $db = $this->loadDB();
        $users = $db["users"] ?? ($db["nhan_su"] ?? []);
        return response()->json(["success" => true, "data" => $users]);
    }

    // POST /api/users
    public function storeUser(Request $req): JsonResponse
    {
        $db = $this->loadDB();
        $newUser = [
            "id" => count($db["users"] ?? []) + 1,
            "name" => $req->input("name", "Cán bộ mới"),
            "email" => $req->input("email", ""),
            "department" => $req->input("department", "TDMU"),
            "roleId" => $req->input("roleId", 3),
            "roleName" => $req->input("roleId", 3) == 1 ? "Admin" : ($req->input("roleId", 3) == 2 ? "Editor" : "Contributor")
        ];
        $db["users"][] = $newUser;
        $this->saveDB($db);
        return response()->json(["success" => true, "data" => $newUser], 201);
    }

    // DELETE /api/users/{id}
    public function destroyUser($id): JsonResponse
    {
        $db = $this->loadDB();
        $db["users"] = array_values(array_filter($db["users"] ?? [], fn($u) => ($u["id"] ?? ($u["MaNhanSu"] ?? null)) != $id));
        $this->saveDB($db);
        return response()->json(["success" => true, "message" => "Đã xóa người dùng"]);
    }

    // GET /api/schedules
    public function schedules(): JsonResponse
    {
        $db = $this->loadDB();
        return response()->json(["success" => true, "data" => $db["schedules"] ?? ($db["lich_xuat_ban"] ?? [])]);
    }

    // GET /api/audits
    public function audits(): JsonResponse
    {
        $db = $this->loadDB();
        return response()->json(["success" => true, "data" => $db["audits"] ?? ($db["nhat_ky"] ?? [])]);
    }

    // GET /api/dashboard & GET /api/analytics
    public function dashboard(): JsonResponse
    {
        $db = $this->loadDB();
        $arts = $db["articles"] ?? ($db["tin_tuc"] ?? []);
        $totalViews = array_reduce($arts, fn($carry, $a) => $carry + ($a["viewsCount"] ?? ($a["LuotXem"] ?? 0)), 0);
        $totalLikes = array_reduce($arts, fn($carry, $a) => $carry + ($a["likesCount"] ?? ($a["LuotThich"] ?? 0)), 0);
        $published = count(array_filter($arts, fn($a) => in_array($a["status"] ?? ($a["TrangThai"] ?? ""), ["published", "Published"])));
        $pending = count(array_filter($arts, fn($a) => in_array($a["status"] ?? ($a["TrangThai"] ?? ""), ["pending", "Pending", "pending_review"])));
        $draft = count(array_filter($arts, fn($a) => in_array($a["status"] ?? ($a["TrangThai"] ?? ""), ["draft", "Draft"])));

        return response()->json([
            "success" => true,
            "totalArticles" => count($arts),
            "totalViews" => $totalViews,
            "totalLikes" => $totalLikes,
            "totalShares" => 0,
            "aiArticlesCount" => count(array_filter($arts, fn($a) => !empty($a["isAiGenerated"]) || !empty($a["is_ai_generated"]))),
            "publishedCount" => $published,
            "data" => [
                "tong_bai" => count($arts),
                "da_xuat_ban" => $published,
                "cho_duyet" => $pending,
                "ban_nhap" => $draft,
                "bai_gan_day" => array_slice($arts, 0, 5)
            ]
        ]);
    }

    // GET /api/analytics
    public function analytics(): JsonResponse
    {
        return $this->dashboard();
    }

    // POST /api/facebook/publish
    public function publishFacebook(Request $req): JsonResponse
    {
        $articleId = $req->input("articleId");
        $title = $req->input("title", "Bài viết TDMU");
        return response()->json([
            "success" => true,
            "facebookPostId" => "simulated_fb_" . ($articleId ?: time()),
            "message" => "[MÔ PHỎNG XUẤT BẢN FANPAGE FACEBOOK OK] Đã chuyển bài viết \"{$title}\" sang trạng thái xuất bản Fanpage TDMU!"
        ]);
    }

    // GET /api/trade-unions
    public function tradeUnions(): JsonResponse
    {
        $db = $this->loadDB();
        return response()->json(["success" => true, "data" => $db["trade_unions"] ?? ($db["to_cong_doan"] ?? [])]);
    }

    // GET /api/monthly-reports
    public function monthlyReports(): JsonResponse
    {
        $db = $this->loadDB();
        $list = $db["monthly_reports"] ?? ($db["bao_cao_thang"] ?? []);
        return response()->json(["success" => true, "count" => count($list), "data" => $list]);
    }
}
