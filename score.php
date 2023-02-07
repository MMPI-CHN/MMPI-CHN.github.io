<?php
/* 
This Script is a scoring script for the the MMPI-2 "L" Scale. 
This script is copyright © 2021, Dark Bandit, All Rights Reserved. International Copyright Secured. 
This script is released pursuant to the GNU Creative Commons - Attribution - Sharealike license. 
Non-Original Content is from the Minnesota Multiphasic Personality Inventory, 
Copyright 1989, University of Minnesota Board Of Regents, All Rights Reserved.
Non-Original Content is used in this script pursuant to the Fair-Use exception to the United States
Copyright Act, as codified at Title 17, United States Code, Section 107 et seq. Adaptation or resuse 
of this script may constitute copyright infringement depending upon the particular conditions of use 
and the particular use case. Please consult an attorney for legal advice concerning copyright.
PLEASE DO NOT REMOVE THIS COPYRIGHT AND LICENSING NOTICE. 
*/
//Start PHP session for server security reasons.
session_start();
/* 
Open html document for output, and set html headers to avoid caching results, and to supress indexing of this script by search engines.
If search engines do not respect the no-index directive and/or your Robots.txt directives, then this page will be indexed as "adult" 
content
 */
echo '<!DOCTYPE html>';
echo '<head>';
echo '<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />';
echo '<meta http-equiv="Pragma" content="no-cache" />';
echo '<meta http-equiv="Expires" content="0" />';
echo '<meta name="robots" content="noindex">';
echo '<meta name="rating" content="adult" />';
echo '<meta name="RATING" content="RTA-5042-1996-1400-1577-RTA" />';
echo '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
echo '</head>';
//This is the score funciton for L-Scale. 	
function score() {
/*set intial script variables, so that variables do not have a null value, to avoid reporting NaN.
This also prevents inadvertant caching of scores in the event the browser does not follow the 
html meta-tag directives. */
$tscore = 0;
$raw = 0;
//STEP 1: Pass POST Data from l.html form element on webserver to this script to determine how person taking test answered.
$sex = $_POST["sex"];
$Q1 = $_POST["Q1"];
$Q2 = $_POST["Q2"];
$Q3 = $_POST["Q3"];
$Q4 = $_POST["Q4"];
$Q5 = $_POST["Q5"];
$Q6 = $_POST["Q6"];
$Q7 = $_POST["Q7"];
$Q8 = $_POST["Q8"];
$Q9 = $_POST["Q9"];
$Q10 = $_POST["Q10"];
$Q11 = $_POST["Q11"];
$Q12 = $_POST["Q12"];
$Q13 = $_POST["Q13"];
$Q14 = $_POST["Q14"];
$Q15 = $_POST["Q15"];
/*
STEP 2: Find raw score. On L-Scale, This is the same for both males and females.
The questions are all keyed false, and though are in the original order 
they do not have the original question numbers as the MMPI-2. Therefore
each 'F' answer adds 1 to variable $raw, and each 'T' response does nothing
in the scoring. 
*/
if ($Q1 == 'F') {$raw = $raw + 1;}
if ($Q2 == 'F') {$raw = $raw + 1;}
if ($Q3 == 'F') {$raw = $raw + 1;}
if ($Q4 == 'F') {$raw = $raw + 1;}
if ($Q5 == 'F') {$raw = $raw + 1;}
if ($Q6 == 'F') {$raw = $raw + 1;}
if ($Q7 == 'F') {$raw = $raw +1 ;}
if ($Q8 == 'F') {$raw = $raw + 1;}
if ($Q9 == 'F') {$raw = $raw + 1 ;}
if ($Q10 == 'F') {$raw = $raw + 1;}
if ($Q11 == 'F') {$raw = $raw + 1;}
if ($Q12 == 'F') {$raw = $raw + 1;}
if ($Q13 == 'F') {$raw = $raw + 1;}
if ($Q14 == 'F') {$raw = $raw + 1;}
if ($Q15 == 'F') {$raw = $raw + 1;}
/* 
STEP 3: look up T Score based on table conversion from raw score. This is the same for both sexes on L-Scale.
A Raw Score of 0 is equal to a T-Score of 35. It is impossible to score lower then T=35 on L Scale. 
*/
if ($raw == 0) {$tscore = 35;}
elseif ($raw == 1) {$tscore = 39;}
elseif ($raw == 2) {$tscore = 43;}
elseif ($raw == 3) {$tscore = 48;}
elseif ($raw == 4) {$tscore = 52;}
elseif ($raw == 5) {$tscore = 56;}
elseif ($raw == 6) {$tscore = 61;}
elseif ($raw == 7) {$tscore = 65;}
elseif ($raw == 8) {$tscore = 70;}
elseif ($raw == 9) {$tscore = 74;}
elseif ($raw == 10) {$tscore = 78;}
elseif ($raw == 11) {$tscore = 83;}
elseif ($raw == 12) {$tscore = 87;}
elseif ($raw == 13) {$tscore = 91;}
elseif ($raw == 14) {$tscore = 96;}
elseif ($raw == '15') {$tscore = '100';}
else { die("Function score did not work as intended. Please inform the Web Master."); }
//output results to html document to inform user of the score, and then close the html document.
echo '<body>';
echo '<h1>L-Scale Scores</h1>';
echo '<p>Your Raw Score is:';
echo $raw;
echo '&nbsp;<br>';
echo 'Your T-Score is:';
echo $tscore;
echo '</p>';
echo '&nbsp;<br>';
echo '<center>';
echo '<footer><p>';
echo '&nbsp;<br>Adapted from Minnesota Multiphasic Personality 2, Second Edition. (MMPI-2). Copyright 1989, University of Minnesota Board of'; 
echo 'Regents, All Rights Reserved.&nbsp;<br>Used pursuant to Fair-Use exception to the United States Copyright Act, 17 U.S.C. 103, et '; 
echo 'seq.&nbsp;<br>&nbsp;</br>';
echo '</p></footer>'; 
echo '</center>';
echo '</p></body></html>';
}
//Call score function and execute server side script code.
score();
/* 
insert code here to write score data to SQL database on localhost. $sex is the sex of the person taking the test.
$raw is the raw score on L-Scale. $tscore is T-score on L-Scale. $Q1, $Q2, etc. return how the person answereed each 
*/
//<!----REPLACE THIS LINE WITH SQL DATABASE CODE. LEAVE ALL LINES BELOW THIS LINE INTACT.---->
//Unset Session vars and destroy PHP session. 
session_unset(); 
session_destroy(); 
exit;
?>
