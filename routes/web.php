<?php

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

Route::get('/', 'Home@index')->name('home');
Route::get('/foundation', 'Foundation@index')->name('foundation_index');

// Protected routes - login will be forced.
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', 'Dashboard@index')->name('dashboard_index');
});

# Auth0
Route::get('/auth0/callback', '\Auth0\Login\Auth0Controller@callback')->name('auth0-callback');
Route::get('/logout', 'Auth\Auth0IndexController@logout')->name('logout')->middleware('auth');
Route::get('/login', 'Auth\Auth0IndexController@login')->name('login');

