from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs
import os, mimetypes

PASSWORD = "letmein123"
ROOT_DIR = "."  # folder where index.html and assets live

class AuthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        authenticated = "Cookie" in self.headers and "authenticated=true" in self.headers["Cookie"]

        # If not authenticated, only allow login page
        if not authenticated:
            if self.path in ["/", "/login"]:
                return self.show_login_form()
            else:
                return self.redirect_to_login()

        # If authenticated, serve files normally
        if self.path in ["/", "/login"]:
            # already logged in, go to index.html
            return self.redirect("/home.html")

        filepath = os.path.join(ROOT_DIR, self.path.lstrip("/"))
        if os.path.isfile(filepath):
            self.send_response(200)
            mime, _ = mimetypes.guess_type(filepath)
            self.send_header("Content-type", mime or "application/octet-stream")
            self.end_headers()
            with open(filepath, "rb") as f:
                self.wfile.write(f.read())
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"File not found")

    def do_POST(self):
        if self.path == "/login":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode()
            params = parse_qs(body)
            password = params.get("password", [""])[0]

            if password == PASSWORD:
                self.send_response(302)
                self.send_header("Set-Cookie", "authenticated=true; HttpOnly")
                self.send_header("Location", "/home.html")
                self.end_headers()
            else:
                self.show_login_form("Incorrect password!")

    def show_login_form(self, message=""):
        self.send_response(200)
        self.send_header("Content-type", "text/html")
        self.end_headers()
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="robots" content="noindex">
            <title>Login</title>
        </head>
        <body>
            <form method="POST" action="/login">
                <h2>Enter Password</h2>
                <input type="password" name="password">
                <button type="submit">Submit</button>
                <p style="color:red;">{message}</p>
            </form>
        </body>
        </html>
        """
        self.wfile.write(html.encode())

    def redirect_to_login(self):
        self.send_response(302)
        self.send_header("Location", "/")
        self.end_headers()

    def redirect(self, location):
        self.send_response(302)
        self.send_header("Location", location)
        self.end_headers()

if __name__ == "__main__":
    server = HTTPServer(("localhost", 8000), AuthHandler)
    print("Serving on http://localhost:8000")
    server.serve_forever()