import templatePath from "./emlTemplate.j2";

const nunjucks = require("nunjucks");

// get the full goos eov name here
// function translateEOV() {}
function arrayOverlap(a, b) {
  return a.some((e) => b.includes(e));
}

function translateRole(isoRoles) {
  console.log(isoRoles);
  return isoRoles;
}

async function recordToEML(record) {
  nunjucks.configure({ autoescape: true, web: true });

  const templateXML = await fetch(templatePath).then((t) => t.text());

  return nunjucks.renderString(templateXML, {
    record,
    translateRole,
    arrayOverlap,
  });
}

export default recordToEML;