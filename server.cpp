#include "server.h"

using std::cerr;
using std::endl;

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
	if( strlen(_exePath) >= SRV_MAX_EXE_PATH ) {
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

// ******** THE SERVER

static const int _socket_request_buf_size = 1024*5000;
static char _socket_request_buf[_socket_request_buf_size + 1];

static char _html_root_path[SRV_MAX_HTML_ROOT_PATH+1]; 			// Root directory for html applications


static int server( void )
{
	WSADATA wsaData; //  use Ws2_32.dll
	size_t result;

	result = WSAStartup(MAKEWORD(2, 2), &wsaData);
	if (result != 0) {
		server_error_message( "WSAStartup failed:\n" + std::to_string( result ) );
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
		server_error_message( "getaddrinfo failed:\n" + std::to_string( result ) );
		WSACleanup(); // unloading  Ws2_32.dll
		return 1;
	}
	// Creating a socket
	int listen_socket = socket(addr->ai_family, addr->ai_socktype, addr->ai_protocol);
	if (listen_socket == INVALID_SOCKET) { 		// If failed to create a socket...
		server_error_message( "Error at socket:\n" + std::to_string( WSAGetLastError() ) );
		freeaddrinfo(addr);
		WSACleanup();
		return 1;
	}

	// Binsding the socket to ip-address
	result = bind(listen_socket, addr->ai_addr, (int)addr->ai_addrlen);
	if (result == SOCKET_ERROR) { 		// If failed to bind...
		server_error_message( "bind failed with error:\n" + std::to_string( WSAGetLastError() ) );
		freeaddrinfo(addr);
		closesocket(listen_socket);
		WSACleanup();
		return 1;
	}

	// Init listening...
	if (listen(listen_socket, SOMAXCONN) == SOCKET_ERROR) {
		server_error_message( "listen failed with error:\n" + std::to_string( WSAGetLastError() ) );
		closesocket(listen_socket);
		WSACleanup();
		return 1;
	}

	int client_socket = INVALID_SOCKET;

	if( _exePath != nullptr ) { 
		strcpy( _html_root_path, _exePath);
		strcat( _html_root_path, "\\" );
	} else {
		_html_root_path[0] = '\x0';
	}
	strcat( _html_root_path, SRV_HTML_ROOT_DIR );

	for (;;) {
		// Accepting an incoming connection...
		server_error_message( "accepting..." );
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

		if (result == SOCKET_ERROR) { 	// Error receiving data
			cerr << "server: recv failed: " << result << endl;
			closesocket(client_socket);
		}
		else if (result == 0) { 		// The connection was closed by the client...
			server_error_message("server: connection closed...");
		} 
		else if( result >= _socket_request_buf_size ) {
			server_error_message("server: too longrequest:\n" + std::to_string( result ) );
			closesocket(client_socket);
		}
		else if (result > 0) { 		// Everything is ok and "result" stores data length
			_socket_request_buf[result] = '\0';
			server_error_message( "server [request]:\n" + std::string(_socket_request_buf) + "\n length=" + std::to_string( result ) );
			server_response( client_socket, _socket_request_buf, result, _html_root_path, _users_and_passwords, _callback );
			closesocket(client_socket);
		}
	}

	// Closing everything...
	closesocket(listen_socket);
	freeaddrinfo(addr);
	WSACleanup();
	return 0;
}

void server_error_message( const std::string &errmsg ) {
	std::cerr << errmsg << std::endl;
}

