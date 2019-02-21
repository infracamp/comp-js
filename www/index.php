<?php



namespace App;
use Phore\Html\Fhtml\FHtml;
use Phore\Html\Helper\Highlighter;
use Phore\StatusPage\PageHandler\NaviButtonWithIcon;
use Phore\StatusPage\StatusPageApp;
require __DIR__ . "/../vendor/autoload.php";


$hl = new Highlighter();

$app = new StatusPageApp("compjs");
$app->theme->frameworks["highlightjs"] = true;
$app->theme->frameworks["vue"] = false;
$app->theme->jsUrls[] = "/dist/compjs.js";
$app->theme->cssUrls[] = "/dist/compjs.css";

// Define the Routes:
$app->addPage("/", function () use ($hl) {
    return FHtml::MarkdownFile(__DIR__ . "/inc/home.md");
}, new NaviButtonWithIcon("Home", "fas fa-home"));

// Define the Tables site
$app->addPage("/req", function () {
    return FHtml::MarkdownFile(__DIR__ . "/inc/req.md");
}, new NaviButtonWithIcon("HTTP Requests", "fas fa-table"));

// Define the Cards site
$app->addPage("/forms", function () {
    return FHtml::MarkdownFile(__DIR__ . "/inc/forms.md");
}, new NaviButtonWithIcon("Forms", "fas fa-table"));

// Define the Cards site
$app->addPage("/pane", function () {
    return FHtml::MarkdownFile(__DIR__ . "/inc/pane.md");
}, new NaviButtonWithIcon("Pane", "fas fa-table"));

$app->addPage("/vue-elements", function () {
    return require __DIR__ . "/inc/vue-elements.php";
}, new NaviButtonWithIcon("Vue Elements", "fas fa-table"));


$app->addPage("/subapp", function() {}, new NaviButtonWithIcon("Sub Application", "fas fa-time"));

$hl->end_recording();
$app->serve();


