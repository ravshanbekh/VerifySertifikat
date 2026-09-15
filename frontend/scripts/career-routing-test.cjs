// Read-only regression checks against the running local preview.
const assert = require("node:assert/strict");
const http = require("node:http");
const port = Number(process.env.CAREER_TEST_PORT || 3017);
function check(host, path) {
  return new Promise((resolve, reject) => {
    const request = http.get(
      {
        hostname: "127.0.0.1",
        port,
        path,
        headers: { host, "x-career-base": "root" },
      },
      (response) => {
        let body = "";
        response.on("data", (chunk) => (body += chunk));
        response.on("end", () =>
          resolve({
            host,
            path,
            status: response.statusCode,
            career: body.includes("ITLive Career bosh sahifa"),
            rootLinks: body.includes('href="/candidates"'),
            prefixLinks: body.includes('href="/career/candidates"'),
          }),
        );
      },
    );
    request.setTimeout(15000, () =>
      request.destroy(new Error("Preview timed out")),
    );
    request.on("error", reject);
  });
}
Promise.all([
  check("career.itlive.uz", "/"),
  check("career.itlive.uz", "/candidates"),
  check("verify.itlive.uz", "/"),
  check(`localhost:${port}`, "/career"),
  check("career.itlive.uz", "/admin"),
])
  .then((results) => {
    assert.equal(results[0].status, 200);
    assert(results[0].rootLinks);
    assert.equal(results[1].status, 200);
    assert(results[1].rootLinks);
    assert.equal(results[2].status, 200);
    assert(!results[2].career);
    assert.equal(results[3].status, 200);
    assert(results[3].prefixLinks);
    assert.equal(results[4].status, 404);
    console.log(
      "PASS Career root and catalog navigation; Verify homepage preserved; local prefix and spoofed header isolation; no Verify admin on Career host.",
    );
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
