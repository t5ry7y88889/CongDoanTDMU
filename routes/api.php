<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ArticleController;
use App\Http\Controllers\AiStudioController;
use App\Http\Controllers\DocumentController;

Route::get('/articles', [ArticleController::class, 'index']);
Route::post('/articles', [ArticleController::class, 'store']);
Route::get('/articles/{id}', [ArticleController::class, 'show']);
Route::put('/articles/{id}', [ArticleController::class, 'update']);
Route::delete('/articles/{id}', [ArticleController::class, 'destroy']);
Route::post('/articles/{id}/approve', [ArticleController::class, 'approve']);

Route::get('/documents', [DocumentController::class, 'index']);
Route::post('/documents', [DocumentController::class, 'store']);
Route::delete('/documents/{id}', [DocumentController::class, 'destroy']);

Route::get('/users', [ArticleController::class, 'users']);
Route::get('/dashboard', [ArticleController::class, 'dashboard']);
Route::get('/analytics', [ArticleController::class, 'analytics']);
Route::get('/schedules', [ArticleController::class, 'schedules']);
Route::get('/audits', [ArticleController::class, 'audits']);
Route::get('/trade-unions', [ArticleController::class, 'tradeUnions']);
Route::get('/monthly-reports', [ArticleController::class, 'monthlyReports']);
Route::post('/facebook/publish', [ArticleController::class, 'publishFacebook']);

Route::post('/ai/studio-package', [AiStudioController::class, 'studioPackage']);
Route::post('/ai/chat', [AiStudioController::class, 'chat']);
Route::post('/ai/repurpose', [AiStudioController::class, 'repurpose']);
