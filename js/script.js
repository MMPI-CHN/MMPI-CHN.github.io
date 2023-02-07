// Append text to the DOM
function append_text(txt) {
  let docbody = document.getElementsByTagName("body")[0];
  docbody.appendChild(document.createTextNode(txt));
  docbody.appendChild(document.createElement("br"));
}

// Append row data to a row
function append_td(row, txt) {
  let tdata = document.createElement("td");
  tdata.appendChild(document.createTextNode(txt));
  row.appendChild(tdata);
}

// Append a row of data to a table
function append_tr(table) {
  let trow = document.createElement("tr");
  for (let i = 1; i < arguments.length; ++i) {
    append_td(trow, arguments[i]);
  }
  table.appendChild(trow);
}

// Append a table to the DOM and return a reference to it
// Arguments are table headings (variable length)
function make_table() {
  let docbody, table, thead, tbody, trow, i;

  docbody = document.getElementsByTagName("body")[0];
  table = document.createElement("table");
  table.setAttribute("border", "5");
  thead = document.createElement("thead");
  table.appendChild(thead);
  tbody = document.createElement("tbody");
  table.appendChild(tbody);
  docbody.appendChild(table);

  trow = document.createElement("tr");
  for (i = 0; i < arguments.length; ++i) {
    append_td(trow, arguments[i]);
  }
  thead.appendChild(trow);

  return tbody;
}

longform = true;	// All questions or first 370
gender = 0;		// 0==male, 1==female
ans = []; 		// Answers to questions: [T,F,?]

// Score the test
function score() {
  // Change mouse pointer to wait indicator
  // This does not seem to work because JavaScript blocks the UI message pump :(
  document.body.style.cursor = "wait";

  // Variable declarations
  let i, j, tscale, q, n, s, rp;
  let k, rawscore, kscore, tscore, percent;
  let t_cnt, f_cnt, cs_cnt, pe;

  // Make the scale and critical item tables
  let scale_table = make_table("Scale", "Scale Description", "Raw Score", "K Score", "T Score", "% Answered");
  let ci_table = make_table("Scale", "Scale Description", "Question", "Answer", "Question Text");

  // Count the number of True, False, and Can't Say answers
  n = longform ? questions.length : 371;
  t_cnt = 0;
  f_cnt = 0;
  cs_cnt = 0;
  for (q = 1; q < n; ++q) {
    switch (ans[q]) {
      case "T":
        ++t_cnt;
        break;
      case "F":
        ++f_cnt;
        break;
      default:
        ++cs_cnt;
        break;
    }
  }
  --q;

  // Add T/F/? stats to scale table
  append_tr(scale_table, "True", " ", t_cnt, " ", " ", (t_cnt * 100 / q).toPrecision(3));
  append_tr(scale_table, "False", " ", f_cnt, " ", " ", (f_cnt * 100 / q).toPrecision(3));
  append_tr(scale_table, "?", " ", cs_cnt, " ", " ", (cs_cnt * 100 / q).toPrecision(3));

  // Score the TRIN/VRIN scales
  // Iterate the *RIN scales
  for (i = 0; i < rin.length; ++i) {
    // Start with default score
    rawscore = rin[i][0][2];
    // Iterate all the answer pairs
    for (j = 0; j < rin[i][1].length; ++j) {
      // Get reference to answer pair
      rp = rin[i][1][j];
      // If answers match, update the raw score
      if (ans[rp[0]] === rp[1] && ans[rp[2]] === rp[3]) {
        rawscore += rp[4];
      }
    }
    // Append results to scale table
    append_tr(scale_table, rin[i][0][0], rin[i][0][1], rawscore, " ", rin[i][2 + gender][rawscore], " ");
  }

  // Score the scales and critical items
  k = 0;
  pe = 0;
  // Iterate all the scales
  for (i = 0; i < scales.length; ++i) {
    n = 0;
    rawscore = 0;
    // Get the T score table, critcal items will not have this (undefined)
    tscale = scales[i][3 + gender];
    // Iterate the True question list
    for (j = 0; j < scales[i][1].length; ++j) {
      // Get the question number
      q = scales[i][1][j];
      // Act upon the answer to that question
      switch (ans[q]) {
        // True
        case "T":
          // Increment the answer count
          ++n;
          // Increment raw score only if True
          ++rawscore;
          // If this is a critcal item, add it to the critical items table
          if (tscale === undefined) {
            append_tr(ci_table, scales[i][0][1], scales[i][0][2], q, "True", questions[q]);
          }
          break;
        case "F":
          // Increment the answer count
          ++n;
          break;
      }
    }
    // Iterate the False question list (same procedure as True above)
    for (j = 0; j < scales[i][2].length; ++j) {
      q = scales[i][2][j];
      switch (ans[q]) {
        case "F":
          ++n;
          ++rawscore;
          if (tscale === undefined) {
            append_tr(ci_table, scales[i][0][1], scales[i][0][2], q, "False", questions[q]);
          }
          break;
        case "T":
          ++n;
          break;
      }
    }
    // Add scale results to scale table
    // T score table must be defined, otherwise this is a critical item
    if (tscale !== undefined) {
      // Capture K for future use
      if (scales[i][0][0] === "K") { k = rawscore; }
      // If there is a K correction, use it
      if (tscale[0]) {
        // Adjust with K
        kscore = k * tscale[0] + rawscore;
        // Round off and make integer
        kscore = Math.floor(kscore + 0.5);
        // T score lookup of corrected score
        tscore = tscale[kscore + 1];
        // No K correction
      } else {
        // K score is undefinded
        kscore = undefined;
        // T score lookup of raw score
        tscore = tscale[rawscore + 1];
      }
      // Calculate percent answered
      percent = n * 100 / (scales[i][1].length + j);
      // Append results to score table
      append_tr(scale_table, scales[i][0][1], scales[i][0][2], rawscore, kscore === undefined ? " " : kscore, tscore, percent.toPrecision(3));

      // Update profile elevation for the 8 scales
      switch (scales[i][0][1]) {
        case "Hs":
        case "D":
        case "Hy":
        case "Pd":
        case "Pa":
        case "Pt":
        case "Sc":
        case "Ma":
          pe += tscore;
          break;
      }
    }
  }
  // Convert profile elevation sum to average (divide by number of scales)
  pe /= 8;
  // Show profile elevation in page
  append_text("Profile Elevation: " + pe.toPrecision(3));

  // Show an answer summary to allow for copy & paste of answers
  append_text("Answer Summary");
  s = "";
  for (q = 1; q < questions.length; ++q) {
    s += ans[q];
    if (s.length >= 75) {
      append_text(s);
      s = "";
    }
  }
  if (s.length) { append_text(s); }

  // Restore mouse pointer
  document.body.style.cursor = "auto";
}

// Read status of radio button group and return value of selected button
function radio_value(rb) {
  if (!rb) { return; }
  for (let i = 0; i < rb.length; i++) {
    if (rb[i].checked === true) {
      return rb[i].value;
    }
  }
}

// Fill the answer array with radio button state and score
function score_rb(form) {
  ans = [undefined];
  for (let i = 1; i < questions.length; ++i) {
    let rbv = radio_value(form.elements["Q" + i]);
    if (rbv) {
      ans.push(rbv);
    } else {
      ans.push("?");
    }
  }
  score();
}

// Fill the answer array from text and score
function score_text(anstext) {
  //alert("Score Text: "+anstext.length);
  ans = [undefined];
  let n = 1;
  // Check each character of text
  for (let i = 0; i < anstext.length; ++i) {
    // Ignore control characters (0 to 31) and space (32)
    if (anstext.charCodeAt(i) > 32) {
      // Convert character to 'T','F' or '?'
      let a;
      switch (anstext.charAt(i)) {
        case "T":
        case "t":
        case "Y":
        case "y":
        case "X":
        case "x":
          a = "T";
          break;
        case "F":
        case "f":
        case "N":
        case "n":
        case "O":
        case "o":
          a = "F";
          break;
        case "?":
        case "-":
          a = "?";
          break;
        default:
          a = undefined;
          break;
      }
      // Save valid answer in answer array
      if (a) {
        ans.push(a);
        ++n;
      }
    }
  }
  alert((n - 1) + " answers entered");
  // If too few valid characters where processed, fill the remaining answers with '?'
  for (; n < questions.length; ++n) { ans.push("?"); }
  // Score it
  score();
}

// Set the test gender - called by onclick() event in the form
function set_gender(g) {
  gender = g;
  //alert("gender: "+g);
}

// Set the test length - called by onclick() event in the form
function use_long_form(lf) {
  let lfd = document.getElementById("longformdiv");
  lfd.style.display = lf ? "inline" : "none";
}

// Write a single question to the HTML page
function doc_write_question(name, text, text_zh) {
  document.write(text + " " + text_zh + "<br>");
  document.write("<input type=\"radio\" name=" + name + " value=\"T\">True");
  document.write("<input type=\"radio\" name=" + name + " value=\"F\">False");
  document.write("<br><br>");
}

// Write all question radio buttons and text to the HTML page - called from the HTML
function doc_write_all_questions() {
  for (var i = 1; i < questions.length; ++i) {
    doc_write_question("Q" + i, i + ". " + questions[i], questions_zh[i]);
    if (i === 370) { document.write("<div id=\"longformdiv\">"); }
  }
  if (i > 370) { document.write("<\/div>"); }
}
