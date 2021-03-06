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

// Define the Cards site
$app->addPage("/timer", function () {
    return FHtml::MarkdownFile(__DIR__ . "/inc/timer.md");
}, new NaviButtonWithIcon("Timer", "fas fa-table"));
// Define the Cards site
$app->addPage("/template", function () {
    return FHtml::MarkdownFile(__DIR__ . "/inc/template.md");
}, new NaviButtonWithIcon("Template", "fas fa-table"));

// Define the Cards site
$app->addPage("/template_demo", function () {
    return FHtml::MarkdownFile(__DIR__ . "/inc/template_demo.md");
}, new NaviButtonWithIcon("Template Demo", "fas fa-table"));
$hl->end_recording();


$app->serve();


