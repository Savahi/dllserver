#include "server.h"
#include "auth.h"
#include "helpers.h"

static const int _uri_buf_size = 400;		// Buffer size for uri
static const int _get_buf_size = 4000;		// Buffer size for get request
static const int _html_file_path_buf_size = SRV_MAX_HTML_ROOT_PATH + 1 + _uri_buf_size + 1;

static const char _http_empty_message[] = "HTTP/1.1 200 OK\r\nContent-Length:0\r\n\r\n";
static const char _http_authorized[] = "HTTP/1.1 200 OK\r\nContent-Length:1\r\n\r\n1";
static const char _http_not_authorized[] = "HTTP/1.1 200 OK\r\nContent-Length:1\r\n\r\n0";
static const char _http_synchro_not_authorized[] = "HTTP/1.1 200 OK\r\nContent-Length:2\r\n\r\n-1";
static const char _http_logged_out[] = "HTTP/1.1 200 OK\r\nContent-Length:1\r\n\r\n1";
static const char _http_header_template[] = "HTTP/1.1 200 OK\r\nVersion: HTTP/1.1\r\nContent-Type:%s\r\nContent-Length:%lu\r\n\r\n";
static const char _http_header_bad_request[] = "HTTP/1.1 400 Bad Request\r\nVersion: HTTP/1.1\r\nContent-Length:0\r\n\r\n";
static const char _http_header_not_found[] = "HTTP/1.1 404 Not Found\r\nVersion: HTTP/1.1\r\nContent-Length:0\r\n\r\n";
static const char _http_header_failed_to_serve[] = "HTTP/1.1 501 Internal Server Error\r\nVersion: HTTP/1.1\r\nContent-Length:0\r\n\r\n";
static const int _http_header_buf_size = sizeof(_http_header_template) + MIME_BUF_SIZE + 100; 

class ResponseWrapper {
	public:
	char header[_http_header_buf_size+1];
	char *body;
	char *body_allocated;
	int body_len;
	ResponseWrapper(): body(nullptr), body_allocated(nullptr), body_len(0) {
		header[0] = '\x0';
	}	
	~ResponseWrapper() {
		if( body_allocated != nullptr ) {
			delete [] body;
		}
	}	
};


static void readHtmlFileAndPrepareResponse( char *file_name, char *html_source_dir, ResponseWrapper &response );
static void querySPAndPrepareResponse( callback_ptr callback, char *uri, char *sess_id, char *user, 
	bool is_get, char *get, char *post, ResponseWrapper &response, ServerData &sd );
static void send_redirect( int client_socket, char *uri );

#define AUTH_URI_NUM 4
static char *_auth_uri[] = { "/index", "/gantt/", "/input/", "/dashboard/" };

static char _login_try_message_buffer[ _http_header_buf_size + 1 + AUTH_SESS_ID_LEN + 1];


void server_response( int client_socket, char *socket_request_buf, int socket_request_buf_size, 
	char *html_source_dir, char **users_and_passwords, callback_ptr callback ) 
{
	static char uri[_uri_buf_size+1];
	char *post;
	bool is_get = false;
	static char get[_get_buf_size+1];
	bool is_options = false;
	int uri_status = getUriToServe(socket_request_buf, uri, _uri_buf_size, &is_get, get, _get_buf_size, &post, &is_options);

	if (uri_status != 0) { 	// Failed to parse uri - closing socket...
		return;
	}

	server_error_message("server: requested uri=" + std::string(uri) );
	char *sess_id = nullptr;
	char *user = nullptr;

	if( strcmp(uri,"/.check_connection") == 0 ) { 	// A system message simply to check availability of the server.
		send(client_socket, _http_empty_message, strlen(_http_empty_message), 0);
		return;
	}				

	static char cookie_sess_id[ AUTH_SESS_ID_LEN + 1 ];
	static char cookie_user[ AUTH_USER_MAX_LEN + 1 ];
	static char post_user[ AUTH_USER_MAX_LEN + 1 ];
	static char post_pass[ AUTH_USER_MAX_LEN + 1 ];
	
	if( strcmp(uri,"/.check_authorized") == 0 ) { 	// A system message to check if user is authorized or not.
		get_user_and_session_from_cookie( socket_request_buf, cookie_user, AUTH_USER_MAX_LEN, cookie_sess_id, AUTH_SESS_ID_LEN );
		if( auth_confirm(cookie_user, cookie_sess_id, true) ) {
			send(client_socket, _http_authorized, strlen(_http_authorized), 0);
		} else {
			send(client_socket, _http_not_authorized, strlen(_http_not_authorized), 0);
		}		
		return;
	}		

	if( strcmp(uri,"/.login") == 0 ) { 	// A login try?
		if( post != nullptr ) {
			get_user_and_pass_from_post( post, post_user, AUTH_USER_MAX_LEN, post_pass, AUTH_USER_MAX_LEN );
server_error_message( std::string("************************************** post_user: ") + std::string(post_user) + std::string("\n") );
server_error_message( std::string("************************************** post_pass: ") + std::string(post_pass) + std::string("\n") );
			sess_id = auth_do(post_user, post_pass, users_and_passwords);
			if( sess_id != nullptr ) { 	// Login try ok - sending sess_id 	
				user = auth_get_user();
				sprintf( _login_try_message_buffer, _http_header_template, "text/plain", strlen(sess_id) );
server_error_message( std::string("************************************** sess: ") + std::string(sess_id) );
				strcat( _login_try_message_buffer, sess_id );
				send(client_socket, _login_try_message_buffer, strlen(_login_try_message_buffer), 0);
				return;
			} 
		}
		sprintf( _login_try_message_buffer, _http_header_template, "text/plain", 0 );
		send(client_socket, _login_try_message_buffer, strlen(_login_try_message_buffer), 0);
		return;
	} 
	
	if( strcmp(uri,"/.logout") == 0 ) { 	// Logging out?
		get_user_and_session_from_cookie( socket_request_buf, cookie_user, AUTH_USER_MAX_LEN, cookie_sess_id, AUTH_SESS_ID_LEN );
		auth_logout(cookie_user, cookie_sess_id);
		send_redirect(client_socket, "/login.html");  // ... redirecting	
		return;
	}
			
	ResponseWrapper response;
	ServerData sd;

	if( strcmp(uri, "/") == 0 ) {
		strcpy(uri, "/index.html");
	}
		
	bool is_query_sp = false; // All SP queries require an authentificated user
	if( strlen(uri) > 1 ) {	
		if( uri[1] == '.' ) {
			is_query_sp = true;
		}
	}			
	if( is_query_sp ) {
		bool is_update_session;
		if( strcmp(uri,"/.check_gantt_synchro") == 0 || strcmp(uri,"/.check_input_synchro") == 0 ) { 		
			is_update_session = false;
		} else {
			is_update_session = true;
		}
		get_user_and_session_from_cookie( socket_request_buf, cookie_user, AUTH_USER_MAX_LEN, cookie_sess_id, AUTH_SESS_ID_LEN );
		if( !auth_confirm(cookie_user, cookie_sess_id, is_update_session) ) {
			if( !is_update_session ) { 	
				send(client_socket, _http_synchro_not_authorized, strlen(_http_synchro_not_authorized), 0);
			} else {
				send( client_socket, _http_header_bad_request, sizeof(_http_header_bad_request), 0 );
			}
			return; 
		}
		try {
			querySPAndPrepareResponse( callback, uri, cookie_sess_id, cookie_user, is_get, get, post, response, sd );
		}
		catch (...) {
			server_error_message( "Failed to create response..." );
			send(client_socket, _http_header_failed_to_serve, strlen(_http_header_failed_to_serve), 0);
			closesocket(client_socket);
			return;
		}
	} else { 	// Serving a file... 
		bool is_auth_required = false;
		for( int i = 0 ; i < AUTH_URI_NUM ; i++ ) {
			if( strncmp( uri, _auth_uri[i], strlen(_auth_uri[i]) ) == 0 ) { // Auth is required!
				is_auth_required = true;
				break;
			}
		}
		if( is_auth_required ) {
			get_user_and_session_from_cookie( socket_request_buf, cookie_user, AUTH_USER_MAX_LEN, cookie_sess_id, AUTH_SESS_ID_LEN );
			if( !auth_confirm(cookie_user, cookie_sess_id, true) ) {
				if( is_html_request(uri) ) { 	// If it is an html request...
					send_redirect(client_socket, "/login.html");  				// ... redirectingto login.html
				} else { // Other requests - sending "Bad Request"				
					send( client_socket, _http_header_bad_request, sizeof(_http_header_bad_request), 0 );
				}
				return; 
			}
		} 
		try {
			readHtmlFileAndPrepareResponse( &uri[1], html_source_dir, response );
		}
		catch (...) {
			server_error_message( "Failed to create response..." );
			send(client_socket, _http_header_failed_to_serve, strlen(_http_header_failed_to_serve), 0);
			closesocket(client_socket);
			return;
		}
	}

	int send_header_result = send(client_socket, response.header, strlen(response.header), 0);
	if (send_header_result == SOCKET_ERROR) { 	// If error...
		server_error_message( "header send failed: " + std::to_string( WSAGetLastError() ) );
	} else {
		if (response.body != nullptr && response.body_len > 0 ) {
			int send_body_result = send(client_socket, response.body, response.body_len, 0);
			if (send_body_result == SOCKET_ERROR) { 	// If error...
				server_error_message( "send failed: " + std::to_string( WSAGetLastError() ) );
			}
		} else if (response.body_allocated != nullptr && response.body_len > 0 ) {
			int send_body_result = send(client_socket, response.body_allocated, response.body_len, 0);
			if (send_body_result == SOCKET_ERROR) { 	// If error...
				server_error_message( "send failed: " + std::to_string( WSAGetLastError() ) );
			}
		}
	}
}


static void querySPAndPrepareResponse( 
	callback_ptr callback,
	char *uri, 	// A query serve 
	char *sess_id, 		// Session id, "null" value means an unauthorized user
	char *user, 		// User name 
	bool is_get,		// If true, it's a get request, might have essential info in *get
	char *get, 			// Points to get request 
	char *post, 		// Points to post request
	ResponseWrapper &response,
	ServerData &sd )
{
	// Must verify if SP should respond with not a file but with a data
	int callback_return; 	// 
	sd.user = user;
	sd.message = nullptr;
	sd.sp_response_buf = nullptr;
	bool binary_data_requested = false;

	if( strcmp( uri, "/.contents" ) == 0 ) {
		sd.message_id = SERVER_GET_CONTENTS;
		callback_return = callback( &sd );
	} 
	else if( strcmp( uri, "/.check_gantt_synchro" ) == 0 && is_get ) {
		sd.message_id = SERVER_CHECK_GANTT_SYNCHRO;			
		sd.message = get;
		callback_return = callback( &sd );
	} 
	else if( strcmp( uri, "/.check_input_synchro" ) == 0 && is_get ) {
		sd.message_id = SERVER_CHECK_INPUT_SYNCHRO;
		sd.message = get;
		callback_return = callback( &sd );
	} 
	else if( strcmp( uri, "./save_gantt" ) == 0 && post != nullptr ) {
		sd.message_id = SERVER_SAVE_GANTT;
		sd.message = post;
		callback_return = callback( &sd );
	} 
	else if( strcmp( uri, "/.save_input" ) == 0 && post != nullptr ) {
		sd.message_id = SERVER_SAVE_INPUT;
		sd.message = post;
		callback_return = callback( &sd );
	} 
	else if( strcmp( uri, "/.save_image" ) == 0 && post != nullptr ) {
		sd.message_id = SERVER_SAVE_IMAGE;
		sd.message = post;
		callback_return = callback( &sd );
	} 
	else if( strcmp( uri, "/.get_image" ) == 0 && is_get ) {
		sd.message_id = SERVER_GET_IMAGE;
		sd.message = get;
		callback_return = callback( &sd );
		binary_data_requested = true;
	} 
	else if( strcmp( uri, "/.gantt_data" ) == 0 && is_get ) {
		sd.message_id = SERVER_GET_GANTT;
		sd.message = get;
		callback_return = callback( &sd );
	} 
	else if( strcmp( uri, "/.input_data" ) == 0 && is_get ) {
		sd.message_id = SERVER_GET_INPUT;
		sd.message = get;
		callback_return = callback( &sd );
	}

	if( sd.sp_response_buf == nullptr || 	// Might happen if mistakenly left as nullptr in SP.
		callback_return < 0 || sd.sp_response_buf_size == 0 || // An error 
		sd.sp_response_buf_size > 1e9 ) 	 // The response is too big
	{
		strcpy(response.header, _http_header_bad_request); 
	} else if( sd.sp_response_file ) { 	// sd.sp_response_buf contains a file name...
		readHtmlFileAndPrepareResponse( sd.sp_response_buf, nullptr, response );
	} else {
		char mime[MIME_BUF_SIZE+1];
		if( binary_data_requested ) { 	// An image? (or other binary data for future use)
			mimeSetType(uri, mime, MIME_BUF_SIZE);
		} else { 	// 
			strcpy( mime, "text/json; charset=utf-8" );
		}
		sprintf( response.header, _http_header_template, mime, (unsigned long)sd.sp_response_buf_size );
			response.body = sd.sp_response_buf;
			response.body_len = sd.sp_response_buf_size;
		server_error_message( "header: " + std::string(response.header) + ", body: " + std::string(response.body) + "\n" );
	}
	return;
}


static void readHtmlFileAndPrepareResponse( char *file_name, char *html_source_dir, ResponseWrapper &response )
{
	// If none of the above - serving a file
	char file_path[ _html_file_path_buf_size ];
	
	if( html_source_dir != nullptr ) {
		strcpy( file_path, html_source_dir );
	} else {
		file_path[0] = '\x0';
	}
	strcat( file_path, file_name );
	
	server_error_message( "Opening: " + std::string(file_path) );
	
	std::ifstream fin(file_path, std::ios::in | std::ios::binary);
	if (fin) {
		server_error_message( "Opened" );

		// Reading http response body
		fin.seekg(0, std::ios::end);
		uintmax_t file_size = fin.tellg();
		fin.seekg(0, std::ios::beg);

		response.body_allocated = new char[file_size + 1];
		response.body_len = file_size;
		fin.read(response.body_allocated, file_size); 	// Adding the file to serve
		fin.close();

		// Initializing http response header
		char mime[MIME_BUF_SIZE+1];
		mimeSetType(file_name, mime, MIME_BUF_SIZE);
		sprintf(response.header, _http_header_template, mime, (unsigned long)(file_size) );
		return;
	}
	server_error_message("Failed to open...");
	sprintf(response.header, _http_header_not_found);
}


static void send_redirect( int client_socket, char *uri ) {
	const char redirect_template[] = "HTTP/1.1 302 Found\r\nLocation: %s\r\n\r\n";
	const int buffer_size = sizeof(redirect_template) + 100;
	char buffer[ buffer_size+1];

	if( strlen(uri) > 100 ) {
		send( client_socket, _http_header_bad_request, sizeof(_http_header_bad_request), 0 );
	} else {
		sprintf( buffer, redirect_template, uri);		
		send( client_socket, buffer, sizeof(buffer), 0 );
 	}
}

