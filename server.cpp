#include <string.h>
#include <iostream>
#include <sstream>
#include <fstream>
#include <string>
#include <string.h>
#include "auth.h"
#include "helpers.h"
#include <thread>
#define SERVER_DLL_EXPORT
#include "WebServer.hpp"

#define _WIN32_WINNT 0x501

#include <WinSock2.h>
#include <WS2tcpip.h>

#pragma comment(lib, "Ws2_32.lib")

using std::cerr;
using std::endl;

static const int _maxExePath = 400;
static char *_exePath = nullptr;

static bool _th_start = false;
static std::thread::native_handle_type _th_handle;

static int server( void );

static callback_ptr _callback;
static char *_ip;
static char *_port;
static char **_users_and_passwords;
static int *_from_sp_message;

int start( StartServerData *ssd, callback_ptr callback ) {
	if( _th_start ) {
		return 0;
	}	

	_exePath = ssd->ExePath;
	if( strlen(_exePath) >= _maxExePath ) {
		return -1;
	}
	_ip = ssd->IP;
	_port = ssd->Port;
	_users_and_passwords = ssd->UsersPasswords;
	_from_sp_message = &ssd->Message;
	_callback = callback;

	std::thread th(server);	
	_th_handle = th.native_handle();
	//th.join(); // Must be removed when integrated with SP
	th.detach();

	_th_start = true;
	return 1;
} 


void error_message( const std::string &errmsg ) {
	const size_t buf_size=2000;
	char buf[buf_size+1];
	ServerData sd;
	sd.message_id = SERVER_NOTIFICATION_MESSAGE;
	if( errmsg.length() > buf_size ) {
		strncpy( buf, errmsg.c_str(), buf_size );
		buf[buf_size] = '\x0';
	} else {
		strcpy( buf, errmsg.c_str() );
	}	
	sd.message = buf;
	_callback(&sd);
}

	static char _html_source_root[] = "html\\";
	static const int _html_source_dir_buf_size = _maxExePath + 1 + sizeof(_html_source_root);
	static char _html_source_dir[_html_source_dir_buf_size + 1]; 			// Root directory for html applications
	static const int _uri_buf_size = 400;		// Buffer size for uri
	static const int _html_file_path_buf_size = _html_source_dir_buf_size + 1 + _uri_buf_size + 1;

	static const char _http_empty_message[] = "HTTP/1.1 200 OK\r\nContent-Length:0\r\n\r\n";
	static const char _http_authorized[] = "HTTP/1.1 200 OK\r\nContent-Length:1\r\n\r\n1";
	static const char _http_not_authorized[] = "HTTP/1.1 200 OK\r\nContent-Length:1\r\n\r\n0";
	static const char _http_synchro_not_authorized[] = "HTTP/1.1 200 OK\r\nContent-Length:2\r\n\r\n-1";
	static const char _http_header_template[] = "HTTP/1.1 200 OK\r\nVersion: HTTP/1.1\r\nContent-Type:%s\r\nContent-Length:%lu\r\n\r\n";
	static const char _http_header_bad_request[] = "HTTP/1.1 400 Bad Request\r\nVersion: HTTP/1.1\r\nContent-Length:0\r\n\r\n";
	static const char _http_header_not_found[] = "HTTP/1.1 404 Not Found\r\nVersion: HTTP/1.1\r\nContent-Length:0\r\n\r\n";
	static const char _http_header_failed_to_serve[] = "HTTP/1.1 501 Internal Server Error\r\nVersion: HTTP/1.1\r\nContent-Length:0\r\n\r\n";
	static const int _http_header_buf_size = sizeof(_http_header_template) + MIME_BUF_SIZE + 100; 

	static void readHtmlFileAndPrepareResponse( 
		char *file_name, 	// A file name to serve 
		char *sess_id, 		// Session id, "null" value means an unauthorized user
		char *user, 		// User name 
		char *get, 			// Points to get request, does not have the ending '\x0' character 
		char *post, 		// Points to post request
		char *response_header, 	// A buffer for response header of size _http_header_buf_size
		char **response_body, 	// Pointer to the menory allocated for response (header+body), must be freed with "del"
		unsigned long int *response_body_len, 	// The length of the response message
		bool *free_response_body ) 	// If true, response_body must be freed with del
	{
		char *response_buf;

		if( get != nullptr ) { 	// Marking "GET" request string after "?" with ending '\x0'
			int len_get = strlen(get);
			int i = 0; 
			for( ; i < len_get && get[i] != ' ' && get[i] != '\r' && get[i] != '\n' ; ) { i++; }
			if( i < len_get ) 
				get[i] = '\x0';	
		}

		// Must verify if SP should respond with not a file but with a data
		int callback_return; 	// 
		ServerData sd;
		sd.user = user;
		sd.message = nullptr;
		sd.sp_response_buf = nullptr;
		bool binary_data_requested = false;
		if( strcmp( file_name, "contents" ) == 0 ) {
			sd.message_id = SERVER_GET_CONTENTS;
			callback_return = _callback( &sd );
		} 
		else if( strcmp( file_name, "gantt/check_synchro" ) == 0 ) {
			sd.message_id = SERVER_CHECK_GANTT_SYNCHRO;
			sd.message = get;
			callback_return = _callback( &sd );
		} 
		else if( strcmp( file_name, "input/check_synchro" ) == 0 ) {
			sd.message_id = SERVER_CHECK_INPUT_SYNCHRO;
			sd.message = get;
			callback_return = _callback( &sd );
		} 
		else if( strcmp( file_name, "gantt/save" ) == 0 && post != nullptr ) {
			sd.message_id = SERVER_SAVE_GANTT;
			sd.message = post;
			callback_return = _callback( &sd );
		} 
		else if( strcmp( file_name, "input/save" ) == 0 && post != nullptr ) {
			sd.message_id = SERVER_SAVE_INPUT;
			sd.message = post;
			callback_return = _callback( &sd );
		} else if( strcmp( file_name, "image/save" ) == 0 && post != nullptr ) {
			sd.message_id = SERVER_SAVE_IMAGE;
			sd.message = post;
			callback_return = _callback( &sd );
		} else if( strcmp( file_name, "image/get" ) == 0 && post == nullptr ) {
			sd.message_id = SERVER_GET_IMAGE;
			sd.message = get;
			callback_return = _callback( &sd );
			binary_data_requested = true;
		}

		if( sd.sp_response_buf != nullptr ) { 	// A callback was called (one of the callback's urls was matched) and the response is in "sd"
			if( callback_return < 0 || sd.sp_response_buf_size == 0 || sd.sp_response_buf_size > 1e9 ) { 	// An error of response is too big
				strcpy(response_header, _http_header_bad_request); 
				*response_body = nullptr;
				*response_body_len = 0;
				*free_response_body = false;
			} else { 	// Ok
				char mime[MIME_BUF_SIZE+1];
				if( binary_data_requested /*post == nullptr && get != nullptr*/ ) { 	// An image? (or other binary data for future use)
					mimeSetType(get, mime, MIME_BUF_SIZE);
				} else { 	// 
					strcpy( mime, "text/json; charset=utf-8" );
				}
				sprintf( response_header, _http_header_template, mime, (unsigned long)sd.sp_response_buf_size );
				*response_body = sd.sp_response_buf;
				*response_body_len = sd.sp_response_buf_size;
				*free_response_body = sd.sp_free_response_buf;
cerr << "response_header: " << response_header << ", response_body: " << response_body << endl;
			}
			return;
		}

		// If SP must be requested for a data file: gantt or input (again the callback must be called)
		char *redirected_by_sp_uri = nullptr;
		if( strcmp( file_name, "gantt/data" ) == 0 ) {
			sd.message_id = SERVER_GET_GANTT;
			sd.message = get;
			if( _callback( &sd ) >= 0 ) {
				redirected_by_sp_uri = sd.sp_response_buf;
			}
		} else if( strcmp( file_name, "input/data" ) == 0 ) {
			sd.message_id = SERVER_GET_INPUT;
			sd.message = get;
			if( _callback( &sd ) >= 0 ) {
				redirected_by_sp_uri = sd.sp_response_buf;
			}
		}
		if( redirected_by_sp_uri ) { 	// The callback WAS called...
			if( strlen(redirected_by_sp_uri) == 0 || strlen(redirected_by_sp_uri) > _uri_buf_size ) { 	// If error or the file name is too long...
				strcpy(response_header, _http_header_bad_request); 
				*response_body = nullptr;
				*response_body_len = 0;
				*free_response_body = false;
				return;
			}
		}

		// If none of the above - serving a file
		char file_path[ _html_file_path_buf_size ];
		
		strcpy( file_path, _html_source_dir );
		if( redirected_by_sp_uri == nullptr ) {
			strcat( file_path, file_name );
		} else {
			strcat( file_path, redirected_by_sp_uri );
		}
		error_message( "Opening: " + std::string(file_path) );
		
		std::ifstream fin(file_path, std::ios::in | std::ios::binary);
		if (fin) {
			error_message( "Opened" );

			// Reading http response body
			fin.seekg(0, std::ios::end);
			uintmax_t file_size = fin.tellg();
			fin.seekg(0, std::ios::beg);

			response_buf = new char[file_size + 1];
			fin.read(response_buf, file_size); 	// Adding the file to serve
			fin.close();

			*response_body = response_buf;
			*response_body_len = file_size;
			*free_response_body = true;

			// Initializing http response header
			char mime[MIME_BUF_SIZE+1];
			if( redirected_by_sp_uri == nullptr ) {
				mimeSetType(file_name, mime, MIME_BUF_SIZE);
			} else {
				mimeSetType(redirected_by_sp_uri, mime, MIME_BUF_SIZE);
			}
			sprintf(response_header, _http_header_template, mime, (unsigned long)(file_size) );
			return;
		}
		error_message("Failed to open...");
		sprintf(response_header, _http_header_not_found);
		*response_body = nullptr;
		*response_body_len = 0;
		*free_response_body = false;
	}


static void send_redirect( int client_socket, char *uri ) {
	const char redirect_template[] = "HTTP/1.1 302 Found\nLocation: %s\r\n\r\n";
	const int buffer_size = sizeof(redirect_template) + 100;
	char buffer[ buffer_size+1];

	if( strlen(uri) > 100 ) {
		send( client_socket, _http_header_bad_request, sizeof(_http_header_bad_request), 0 );
	} else {
		sprintf( buffer, redirect_template, uri);		
		send( client_socket, buffer, sizeof(buffer), 0 );
 	}
}


static const int _socket_request_buf_size = 1024*5000;
static char _socket_request_buf[_socket_request_buf_size + 1];

#define AUTH_URI_NUM 12
static char *_auth_uri[] = { "/", "/index.html", "/contents", 
	"/gantt/data", "/gantt/save", "/gantt/check_synchro", 
	"/input/data", "/input/save", "/input/check_synchro",
	"dashboard/data", "/dashboard/save", "/dashboard/check_synchro" };

static char _login_try_message_buffer[ _http_header_buf_size + 1 + AUTH_SESS_ID_BUF_SIZE + 1];

static char *_not_authorized_user = "Not-authorized";

static int server( void )
{
	WSADATA wsaData; //  use Ws2_32.dll
	size_t result;

	result = WSAStartup(MAKEWORD(2, 2), &wsaData);
	if (result != 0) {
		error_message( "WSAStartup failed:\n" + std::to_string( result ) );
		return result;
	}

	struct addrinfo* addr = NULL; // holds socket ip etc

	// To be initialized with constants and values...
	struct addrinfo hints;
	ZeroMemory(&hints, sizeof(hints));

	hints.ai_family = AF_INET; // AF_INET - using net to work with socket
	hints.ai_socktype = SOCK_STREAM; // A socket of a "stream" type
	hints.ai_protocol = IPPROTO_TCP; // TCP protocol
	hints.ai_flags = AI_PASSIVE; // The socket should take incoming connections

	result = getaddrinfo(_ip, _port, &hints, &addr); // Port 8000 is used
	if (result != 0) { 		// If failed...
		error_message( "getaddrinfo failed:\n" + std::to_string( result ) );
		WSACleanup(); // unloading  Ws2_32.dll
		return 1;
	}
	// Creating a socket
	int listen_socket = socket(addr->ai_family, addr->ai_socktype,
		addr->ai_protocol);
	if (listen_socket == INVALID_SOCKET) { 		// If failed to create a socket...
		error_message( "Error at socket:\n" + std::to_string( WSAGetLastError() ) );
		freeaddrinfo(addr);
		WSACleanup();
		return 1;
	}

	// Binsding the socket to ip-address
	result = bind(listen_socket, addr->ai_addr, (int)addr->ai_addrlen);
	if (result == SOCKET_ERROR) { 		// If failed to bind...
		error_message( "bind failed with error:\n" + std::to_string( WSAGetLastError() ) );
		freeaddrinfo(addr);
		closesocket(listen_socket);
		WSACleanup();
		return 1;
	}

	// Init listening...
	if (listen(listen_socket, SOMAXCONN) == SOCKET_ERROR) {
		error_message( "listen failed with error:\n" + std::to_string( WSAGetLastError() ) );
		closesocket(listen_socket);
		WSACleanup();
		return 1;
	}

	int client_socket = INVALID_SOCKET;

	strcpy( _html_source_dir, _exePath);
	strcat( _html_source_dir, "\\" );
	strcat( _html_source_dir, _html_source_root );

	for (;;) {
		// Accepting an incoming connection...
		error_message( "accepting..." );
		client_socket = accept(listen_socket, NULL, NULL);
		if (client_socket == INVALID_SOCKET) {
			closesocket(listen_socket);
			WSACleanup();
			return 1;
		}

		if( _from_sp_message != nullptr ) {
			if( *_from_sp_message == 100 ) { 	// 100 is the exit code 
				closesocket(listen_socket);
				WSACleanup();
				_th_start = false;
				return 1;
			}
		}

		result = recv(client_socket, _socket_request_buf, _socket_request_buf_size, 0);
error_message( "server [request]:\n" + std::string(_socket_request_buf) + "\n length=" + std::to_string( result ) );

		if (result == SOCKET_ERROR) { 	// Error receiving data
			cerr << "server: recv failed: " << result << endl;
			closesocket(client_socket);
		}
		else if (result == 0) { 		// The connection was closed by the client...
			error_message("server: connection closed...");
		} 
		else if( result >= _socket_request_buf_size ) {
			error_message("server: too longrequest:\n" + std::to_string( result ) );
			closesocket(client_socket);
		}
		else if (result > 0) { 		// Everything is ok and "result" stores data length
			_socket_request_buf[result] = '\0';

			char uri[_uri_buf_size+1];
			char *post;
			char *get;
			int uri_status = getUriToServe(_socket_request_buf, uri, _uri_buf_size, &get, &post);

			if (uri_status != 0) { 	// Failed to parse uri - closing socket...
				closesocket(client_socket);
				continue;
			}

			error_message("server: requested uri=" + std::string(uri) );
			char *sess_id = nullptr;
			char *user = nullptr;

			if( strcmp(uri,"/check_connection") == 0 ) { 	// A system message simply to check availability of the server.
				send(client_socket, _http_empty_message, strlen(_http_empty_message), 0);
				closesocket(client_socket);
				continue;
			}				

			if( strcmp(uri,"/check_authorized") == 0 ) { 	// A system message to check if user is authorized or not.
				sess_id = auth_confirm(_socket_request_buf, true);
				if( sess_id == nullptr ) {
					send(client_socket, _http_not_authorized, strlen(_http_not_authorized), 0);
				} else {
					send(client_socket, _http_authorized, strlen(_http_authorized), 0);
				}		
				closesocket(client_socket);
				continue;
			}		

			if( post != nullptr && strcmp(uri,"/login") == 0 ) { 	// A login try?
				sess_id = auth_do(post, _users_and_passwords);
				if( sess_id != nullptr ) { 	// Login try ok - sending sess_id 	
					user = auth_get_user_name();
					sprintf( _login_try_message_buffer, _http_header_template, "text/plain", strlen(sess_id) );
					strcat( _login_try_message_buffer, sess_id );
				} else { 	// Login try failed - sending 0 bytes
					sprintf( _login_try_message_buffer, _http_header_template, "text/plain", 0 );
				}
				result = send(client_socket, _login_try_message_buffer, strlen(_login_try_message_buffer), 0);
				if (result == SOCKET_ERROR) { 	// If error...
					error_message( "*********\nLogin response send failed: " + std::to_string( WSAGetLastError() ) );
				} 
				closesocket(client_socket);
				continue;
			} 

			// Is auth required?
			bool bUpdateSession;
			if( strcmp(uri,"/gantt/check_synchro") == 0 || strcmp(uri,"/input/check_synchro") == 0 ) { 	
				bUpdateSession = false;
			} else {
				bUpdateSession = true;
			}
			for( int i = 0 ; i < AUTH_URI_NUM ; i++ ) {
				if( strcmp( uri, _auth_uri[i] ) == 0 ) { // Auth is required!
					sess_id = auth_confirm(_socket_request_buf, bUpdateSession);
					if( sess_id == nullptr ) {
						if( strcmp(uri,"/gantt/check_synchro") == 0 || strcmp(uri,"/input/check_synchro") == 0 ) { 	
							send(client_socket, _http_synchro_not_authorized, strlen(_http_synchro_not_authorized), 0);
							closesocket(client_socket);
							continue; 
						}
						if( strcmp( uri, "/" ) == 0 || strcmp(uri, "/index") == 0 || is_html_request(uri) ) { 	// If it is an html request...
							send_redirect(client_socket, "/login.html");  										// ... redirectingto login.html
							closesocket(client_socket);
							continue; 
						}
						// Other requests - sending "Bad Request"
						send( client_socket, _http_header_bad_request, sizeof(_http_header_bad_request), 0 );
						closesocket(client_socket);
						continue; 
					} 
				} 
			}

			// 
			if( strcmp(uri,"/logout") == 0 ) { 	// Logging out?
				auth_logout(_socket_request_buf);
				send_redirect(client_socket, "/login.html");  // ... redirecting	
				closesocket(client_socket);
				continue; 
			}

			if( sess_id == nullptr ) {
				user = _not_authorized_user;
			} else {
				user = auth_get_user_name();
				error_message("server sess_id=" + std::string(sess_id) );
			}
			
			if( strcmp( uri, "/" ) == 0 || strcmp(uri, "/index") == 0 ) {
				strcpy( uri, "/index.html" );
				error_message( "Redirected to " + std::string( uri ) );
			}
			

			char response_header[_http_header_buf_size+1];
			char *response_body = nullptr;
			unsigned long int response_body_len = 0;
			bool free_response_body = false;
			try {
				readHtmlFileAndPrepareResponse( &uri[1], sess_id, user, 
					get, post, response_header, &response_body, &response_body_len, &free_response_body );
			}
			catch (...) {
				error_message( "Failed to create response..." );
				result = send(client_socket, _http_header_failed_to_serve, strlen(_http_header_failed_to_serve), 0);
				closesocket(client_socket);
				continue;
			}
				
			result = send(client_socket, response_header, strlen(response_header), 0);
			if (result == SOCKET_ERROR) { 	// If error...
				error_message( "header send failed: " + std::to_string( WSAGetLastError() ) );
			} else {
				if (response_body != nullptr && response_body_len > 0 ) {
					// Sending the file to client...
					result = send(client_socket, response_body, response_body_len, 0);
					if (result == SOCKET_ERROR) { 	// If error...
						error_message( "send failed: " + std::to_string( WSAGetLastError() ) );
					}
					if( free_response_body ) {
						delete[] response_body;
					}
				}
			}
			// Closing connection to client...
			closesocket(client_socket);
		}
	}

	// Closing everything...
	closesocket(listen_socket);
	freeaddrinfo(addr);
	WSACleanup();
	return 0;
}
