<?php

namespace App\Http\Controllers;

use App\User;
use App\Sponsor;
use App\Http\Resources\Sponsor as SponsorResource;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class Committee extends Controller
{
    public function index()
    {
        return view('committee/dashboard')->with("props", array(
            "baseUrl" => route("committee_dashboard", array(), false),
            "user" => array(
                "type" => Auth::user()->type,
                "name" => Auth::user()->name
            ),
        ));
    }

    public function api_get($path) {
        switch ($path) {
            case 'add-sponsor': return $this->addSponsor("New Sponsor");
            default: return $this->default();
        }

    }

    public function api_post(Request $request, $path) {
        $r = $request->request;
        switch ($path) {
            case 'add-sponsor': return $this->addSponsor($r->get('name'));
            default: return $this->default();
        }
    }

    /**
     * Private Functions
     */
    private function default() {
        return $this->fail("Route not found");
    }

    private function fail($message = '') {
        return response()->json([
            'success' => 'false',
            'message' => $message
        ]);
    }

    private function addSponsor($name) {
        $slug = $this->slugify($name);
        if(strlen($slug) > 0) {
            $check = Sponsor::where('slug', $slug)->first();
            if (!$check) {
                $sponsor = new Sponsor();
                $sponsor->setAttribute("slug", $slug);
                $sponsor->setAttribute("name", $name);
                $sponsor->save();
                if ($sponsor->save()) {
                    return SponsorResource::make($sponsor);
                } else {
                    return $this->fail("Failed to save new sponsor object");
                }
            } else {
                return $this->fail("Sponsor already exists");
            }
        } else {
            return $this->fail("Sponsor title invalid");
        }
    }



    private static function slugify($text)
    {
        // replace non letter or digits by -
        $text = preg_replace('~[^\pL\d]+~u', '-', $text);

        // transliterate
        $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);

        // remove unwanted characters
        $text = preg_replace('~[^-\w]+~', '', $text);

        // trim
        $text = trim($text, '-');

        // remove duplicate -
        $text = preg_replace('~-+~', '-', $text);

        // lowercase
        $text = strtolower($text);

        if (empty($text)) {
            return 'n-a';
        }

        return $text;
    }
}
