<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class DocumentController extends Controller
{
    private function getDb()
    {
        $path = base_path('server/database.json');
        if (!File::exists($path)) {
            return ['van_ban' => []];
        }
        return json_decode(File::get($path), true) ?: ['van_ban' => []];
    }

    private function saveDb($data)
    {
        $path = base_path('server/database.json');
        File::put($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    }

    public function index(Request $request)
    {
        $db = $this->getDb();
        $list = $db['van_ban'] ?? [];
        $category = $request->query('category', 'all');
        $search = $request->query('search', '');

        if ($category && $category !== 'all') {
            $list = array_values(array_filter($list, function($d) use ($category) {
                return ($d['loai_van_ban'] ?? '') === $category;
            }));
        }

        if ($search) {
            $q = mb_strtolower($search);
            $list = array_values(array_filter($list, function($d) use ($q) {
                return str_contains(mb_strtolower($d['so_hieu'] ?? ''), $q) ||
                       str_contains(mb_strtolower($d['tieu_de'] ?? ''), $q) ||
                       str_contains(mb_strtolower($d['co_quan_ban_hanh'] ?? ''), $q);
            }));
        }

        return response()->json([
            'success' => true,
            'count' => count($list),
            'data' => $list
        ]);
    }

    public function store(Request $request)
    {
        $so_hieu = $request->input('so_hieu');
        $tieu_de = $request->input('tieu_de');
        if (!$so_hieu || !$tieu_de) {
            return response()->json(['success' => false, 'error' => 'Số hiệu và Trích yếu văn bản là bắt buộc!']);
        }

        $categoryNames = [
            'tuyentruyen' => 'Công văn tuyên truyền',
            'kehoach' => 'Kế hoạch hoạt động',
            'luat' => 'Văn bản luật',
            'quyetdinh' => 'Quyết định'
        ];

        $loai_van_ban = $request->input('loai_van_ban', 'tuyentruyen');
        $db = $this->getDb();
        $list = $db['van_ban'] ?? [];
        $nextId = count($list) > 0 ? max(array_map(function($d) { return (int)($d['id'] ?? 0); }, $list)) + 1 : 1;

        $newDoc = [
            'id' => $nextId,
            'MaVanBan' => $nextId,
            'so_hieu' => trim($so_hieu),
            'SoHieuVanBan' => trim($so_hieu),
            'tieu_de' => trim($tieu_de),
            'TenVanBan' => trim($tieu_de),
            'loai_van_ban' => $loai_van_ban,
            'loai_van_ban_ten' => $categoryNames[$loai_van_ban] ?? 'Công văn tuyên truyền',
            'co_quan_ban_hanh' => $request->input('co_quan_ban_hanh', 'Ban Thường Vụ Công Đoàn TDMU'),
            'ngay_ban_hanh' => $request->input('ngay_ban_hanh', date('Y-m-d')),
            'nguoi_ky' => $request->input('nguoi_ky', 'Ban Thường Vụ'),
            'NguoiKy' => $request->input('nguoi_ky', 'Ban Thường Vụ'),
            'file_url' => $request->input('file_url', 'uploads/documents/van_ban_' . $nextId . '.pdf'),
            'dung_luong' => $request->input('dung_luong', '1.5 MB'),
            'luot_tai' => 0,
            'created_at' => date('Y-m-d H:i:s')
        ];

        array_unshift($list, $newDoc);
        $db['van_ban'] = $list;
        $this->saveDb($db);

        return response()->json([
            'success' => true,
            'message' => 'Đã đăng tải văn bản thành công!',
            'data' => $newDoc
        ]);
    }

    public function destroy($id)
    {
        $db = $this->getDb();
        $list = $db['van_ban'] ?? [];
        $id = (int)$id;

        $found = false;
        $newList = [];
        foreach ($list as $d) {
            if ((int)($d['id'] ?? 0) === $id) {
                $found = true;
            } else {
                $newList[] = $d;
            }
        }

        if (!$found) {
            return response()->json(['success' => false, 'error' => 'Không tìm thấy văn bản!']);
        }

        $db['van_ban'] = $newList;
        $this->saveDb($db);

        return response()->json([
            'success' => true,
            'message' => 'Đã xóa văn bản thành công!'
        ]);
    }
}
