#include <string.h>
#include <string>
#include "helpers.h"                                                        


	void mimeSetType(char *fn, char *mime_buf, int mime_buf_size) {
		int l = strlen(fn);
		if (l > 4 && (tolower(fn[l-1]) == 's' && tolower(fn[l-2]) == 's' && tolower(fn[l-3]) == 'c' && fn[l-4] == '.')) {
			strcpy(mime_buf, "text/css; charset=utf-8"); 	// .css
		} else if( (l > 5 && tolower(fn[l-1]) == 'n' && tolower(fn[l-2]) == 'o' && tolower(fn[l-3]) == 's' && tolower(fn[l-4]) == 'j' && fn[l-5] == '.') ) {
			strcpy(mime_buf, "text/json; charset=utf-8"); 	// .json
		} else if( (l > 5 && tolower(fn[l-1]) == 'g' && tolower(fn[l-2]) == 'e' && tolower(fn[l-3]) == 'p' && tolower(fn[l-4]) == 'j' && fn[l-5] == '.') ) {
			strcpy(mime_buf, "text/jpeg"); 	// .jpeg
		} else if( (l > 4 && tolower(fn[l-1]) == 'g' && tolower(fn[l-2]) == 'p' && tolower(fn[l-3]) == 'j' && fn[l-4] == '.') ) {
			strcpy(mime_buf, "text/jpeg"); 	// .jpg
		} else if( (l > 4 && tolower(fn[l-1]) == 'g' && tolower(fn[l-2]) == 'n' && tolower(fn[l-3]) == 'p' && fn[l-4] == '.') ) {
			strcpy(mime_buf, "text/png"); 	// .jpg
		} else if( (l > 4 && tolower(fn[l-1]) == 'f' && tolower(fn[l-2]) == 'i' && tolower(fn[l-3]) == 'g' && fn[l-4] == '.') ) {
			strcpy(mime_buf, "text/gif"); 	// .jpg
		} else if( (l > 5 && tolower(fn[l-1]) == 'f' && tolower(fn[l-2]) == 'f' && tolower(fn[l-3]) == 'i' && tolower(fn[l-4]) == 't' && fn[l-5] == '.') ) {
			strcpy(mime_buf, "text/tiff"); 	// .json
		} else if( (l > 4 && tolower(fn[l-1]) == 'f' && tolower(fn[l-2]) == 'i' && tolower(fn[l-3]) == 't' && fn[l-4] == '.') ) {
			strcpy(mime_buf, "text/tif"); 	// .jpg
		} else if( (l > 4 && tolower(fn[l-1]) == 'm' && tolower(fn[l-2]) == 't' && tolower(fn[l-3]) == 'h' && fn[l-4] == '.') ) {
			strcpy(mime_buf, "text/html; charset=utf-8"); 	// .html
		} else if( (l > 4 && tolower(fn[l-1]) == 'l' && tolower(fn[l-2]) == 'm' && tolower(fn[l-3]) == 't' && tolower(fn[l-4]) == 'h' && fn[l-5] == '.' ) ) {
			strcpy(mime_buf, "text/html; charset=utf-8"); 	// .html
		} else if( (l > 4 && tolower(fn[l-1]) == 't' && tolower(fn[l-2]) == 'x' && tolower(fn[l-3]) == 't' && fn[l-4] == '.') ) {
			strcpy(mime_buf, "text/plain; charset=utf-8"); 	// .jpg
		} else {
			strcpy(mime_buf, "text/html; charset=utf-8");
		}
	}

	void create_cookie( char *sessId, char *user, char *cookie_buf, unsigned int cookie_buf_size ) {
		if (sessId == nullptr) {
			sprintf(cookie_buf, "Set-Cookie: sessid=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT\r\nSet-Cookie: user=Not Authorized; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT\r\n");
		}
		else {
			if( strlen(user) == 0 ) {
				sprintf(cookie_buf, "Set-Cookie: sessid=%s; path=/;\r\n", sessId);
			} else {
				sprintf(cookie_buf, "Set-Cookie: sessid=%s; path=/;\r\nSet-Cookie: user=%s; path=/;\r\n", sessId, user);
			}
		}
	}


	int getUriToServe(char *b, char *uri_buf, int uri_buf_size, char **get, char **post) {
		int r = -1;
		int b_len = strlen(b);

		*get = nullptr;
		*post = nullptr;
		// Searching for "GET" or "POST"
		int uri_index = -1;
		for (int i = 0; i < b_len - 4; i++) {
			if (tolower(b[i]) == 'g' && tolower(b[i + 1]) == 'e' && tolower(b[i + 2]) == 't') {
				uri_index = i;
				for (int j = i+3; j < b_len - 4; j++) {
					if ( b[j] == '?' ) {
						*get = &b[j + 1];
						break;
					}
				}
				break;
			}
			if (tolower(b[i]) == 'p' && tolower(b[i + 1]) == 'o' && tolower(b[i + 2]) == 's' && tolower(b[i + 3]) == 't') {
				uri_index = i;
				int post_index = -1;
				for (int j = i+4; j < b_len - 4; j++) {
					if (tolower(b[j]) == '\r' && tolower(b[j+1]) == '\n' && tolower(b[j+2]) == '\r' && tolower(b[j+3]) == '\n') {
						*post = &b[j + 4];
						break;
					}
				}
				break;
			}
		}
		if (uri_index != -1) { 	// If "GET" found...
			int first_path_index = -1;
			int last_path_index = -1;
			for (int j = uri_index + 3; j < b_len - 1; j++) {
				if (b[j] == ' ') {
					continue;
				}
				if (b[j] == '/') {
					first_path_index = j;
					break;
				}
			}
			if (first_path_index != -1) {
				last_path_index = first_path_index;
				for (int j = first_path_index + 1; j < b_len; j++) {
					if (b[j] != ' ' && b[j] != '\r' && b[j] != '\n' && b[j] != '?') {
						last_path_index++;
						continue;
					}
					break;
				}
			}
			int path_len = (last_path_index - first_path_index + 1);
			if (first_path_index != -1 && last_path_index != -1 && path_len <= uri_buf_size) {
				strncpy_s(uri_buf, uri_buf_size, &b[first_path_index], path_len);
				uri_buf[path_len] = '\x0';
				r = 0;
			}
		}
		return r;
	}


bool is_html_request( char *uri ) {

	int l = strlen(uri);
	if (l > 4 && (tolower(uri[l-1]) == 'm' && tolower(uri[l-2]) == 't' && tolower(uri[l-3]) == 'h' && uri[l-4] == '.')) {
		return true;
	}
	if( (l > 5 && tolower(uri[l-1]) == 'l' && tolower(uri[l-2]) == 'm' && tolower(uri[l-3]) == 't' && tolower(uri[l-4]) == 'h' && uri[l-5] == '.') ) {
		return true;
	}

	return false;
}




/*
	static const char _http_header_bad_request[] = "HTTP/1.1 400 Bad Request\r\nVersion: HTTP/1.1\r\nContent-Length:0\r\n\r\n";
	static const char _http_header_not_found[] = "HTTP/1.1 404 Not Found\r\nVersion: HTTP/1.1\r\nContent-Length:0\r\n\r\n";
	static const int _http_header_buf_size = sizeof(_http_header_template) + COOKIE_BUF_SIZE + MIME_BUF_SIZE + 100; 

	void create_http_header_bad_request( char *dst, int dst_buf_size ) {
		if( dst_buf_size > sizeof(_http_header_bad_request) ) {			
			strcpy( dst, _http_header_bad_request );
		} else {
			strcpy( dst, "" );
		}
	}

	void create_http_header_not_found( char *dst, int dst_buf_size ) {
		if( dst_buf_size > sizeof(_http_header_not_found) ) {			
			strcpy( dst, _http_header_not_found );
		} else {
			strcpy( dst, "" );
		}
	}

	static const char _http_header_template[] = "HTTP/1.1 200 OK\r\nVersion: HTTP/1.1\r\n%sContent-Type:%s\r\nContent-Length:%lu\r\n\r\n";

	void create_http_header( char *dst, int dst_buf_size, char *cookie, char *mime, unsigned long int cl ) {
		if( dst_buf_size > sizeof(_http_header_not_found) ) {			
			strcpy( dst, _http_header_not_found );
		} else {
			strcpy( dst, "" );
		}
	}

*/