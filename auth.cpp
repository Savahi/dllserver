#include <iostream>
#include <fstream>
#include <sstream>
#include <chrono>
#include <string>
#include <filesystem>
#include <string.h>
#include "auth.h"
#include "sha2.h"

	using namespace std;
	
	static int read_sessions(fstream &f);
	static int find_session(char *sess_id);

	uint64_t timeSinceEpochMillisec() {
		using namespace std::chrono;
		return duration_cast<milliseconds>(system_clock::now().time_since_epoch()).count();
	}

	static const uint64_t _sess_inactivity = 30*60*1000;
	static const char *_sess_file_name = "server.sess";
	
	const unsigned long _sess_id_size = AUTH_SESS_ID_BUF_SIZE;
	const unsigned long _sess_user_name_size = AUTH_USER_NAME_BUF_SIZE;
	static char *_sess_id = nullptr;
	static char *_sess_user_name = nullptr;
	
	struct Sess {
		char sess_id[_sess_id_size+1];
		char sess_user_name[_sess_user_name_size+1];
		uint64_t sess_time;
	};

	static const unsigned long int _sess_buf_capacity = 20;
	static Sess _sess_buf[_sess_buf_capacity];


	char *auth_get_sess_id( void ) {
		return _sess_id;
	}


	char *auth_get_user_name( void ) {
		return _sess_user_name;
	}


	static void sess_buf_reset() {
		for( int i = 0 ; i < _sess_buf_capacity ; i++ ) {
			strcpy(_sess_buf[i].sess_id, "0");				
			_sess_buf[i].sess_time = 0;				
		}
	}


	static int auth_create(const char *sess_id, char *sess_user_name) {
		int r = 0;
		fstream f;
		_sess_id = nullptr;
		_sess_user_name = nullptr;

		int status = read_sessions(f);
		if (status >= 0) {
			uint64_t now = timeSinceEpochMillisec();
			for (int i = 0; i < _sess_buf_capacity; i++) {
				bool c1 = now - _sess_buf[i].sess_time >= _sess_inactivity; 	// An old one
				bool c2 = strncmp( _sess_buf[i].sess_id, sess_id, strlen(sess_id) ) == 0; 	// Reauth found
				if ( c1 || c2 ) {
					strcpy(_sess_buf[i].sess_id, sess_id);
					strcpy(_sess_buf[i].sess_user_name, sess_user_name);
					_sess_buf[i].sess_time = now;
					try {
						f.write((char*)&_sess_buf[0], sizeof(_sess_buf));
					} catch(...) {
						r = -1;
					}
					_sess_id = _sess_buf[i].sess_id;
					_sess_user_name = _sess_buf[i].sess_user_name;
					break;
				}
			}
			f.close();
		}
		return r;
	}


	static int auth_delete(char *sess_id) {
		int r = 0;
		fstream f;
		_sess_id = nullptr;
		_sess_user_name = nullptr;

		int status = read_sessions(f);
		if (status >= 0) {
			for (int i = 0; i < _sess_buf_capacity; i++) {
				bool condition = strncmp( _sess_buf[i].sess_id, sess_id, strlen(sess_id) ) == 0; 	// Reauth found
				if ( condition ) {
					strcpy(_sess_buf[i].sess_id, "0");
					_sess_buf[i].sess_time = 0;
					try {
						f.write((char*)&_sess_buf[0], sizeof(_sess_buf));
					} catch(...) {
						r = -1;
					}
					break;
				}
			}
			f.close();
		}
		return r;
	}


	static int auth_confirm_and_update(char *sess_id, bool bUpdateSession) {
		_sess_id = nullptr;
		_sess_user_name = nullptr;

		if( sess_id == nullptr ) {
			return -1; 
		}
		if( strlen(sess_id) < 20 ) {
			return -1;
		}
		int r = -1;
		fstream f;	
		int status = read_sessions(f);
		if (status == sizeof(_sess_buf)) { 		// Might be as well simply "if( status > 0)"
//cerr << "SESSION READ" << endl;
			for (int i = 0; i < _sess_buf_capacity; i++) {
				if( strncmp( _sess_buf[i].sess_id, sess_id, strlen(sess_id) ) == 0 ) { 
//cerr << "CMP OK" << endl;
					uint64_t now = timeSinceEpochMillisec();
//cerr << "TIME SINCE: " << (now - _sess_buf[i].sess_time) << endl;
					if (now - _sess_buf[i].sess_time < _sess_inactivity) {
						if( bUpdateSession ) {
							_sess_buf[i].sess_time = now;
							try {
								f.write((char*)&_sess_buf[0], sizeof(_sess_buf));
								r = i;
							} catch(...) {
								;
							}
						} else {
							r = i;
						}
						_sess_id = _sess_buf[i].sess_id;
						_sess_user_name = _sess_buf[i].sess_user_name;
						break;
					}
				}
			}
			f.close();
		}
		return r;
	}


	static int read_sessions(fstream &f) {
		int r=-1;
		try {
			if (!std::experimental::filesystem::exists(_sess_file_name) ) {
				f.open(_sess_file_name, ios::out | ios::binary);
				sess_buf_reset();
				r = 0;
			} else {
				uintmax_t fsize = std::experimental::filesystem::file_size(_sess_file_name);
				if (fsize != sizeof(_sess_buf) ) { 	// The session file is corruped?
					f.open(_sess_file_name, ios::out | ios::binary | ios::trunc); 	// Truncating then
					sess_buf_reset();
					r = 0;
				} else {
					f.open(_sess_file_name, ios::in | ios::out | ios::binary);
					if(f) {
						f.read( (char*)&_sess_buf[0], sizeof(_sess_buf) );
						if(f) {
							r = f.gcount();
						} else {
							sess_buf_reset();
							r = 0;
						}
						f.seekg(ios::beg);
					}
				}
			}
		} catch(...) {
			if(f) {		
				f.close();
			}
			r = -1;
		}
		return r;
	}


	bool get_session_id_from_cookie( char *b, char *sess_id_buf, int sess_id_buf_size ) {
		bool r = false; 
		int b_len = strlen(b);

		int cookie_index = -1;
		for (int i = 0; i < b_len - 8; i++) {
			if (tolower(b[i]) == 'c' && tolower(b[i + 1]) == 'o' && tolower(b[i + 2]) == 'o' &&
				tolower(b[i + 3]) == 'k' && tolower(b[i + 4]) == 'i' && tolower(b[i + 5]) == 'e' && b[i + 6] == ':') {
				cookie_index = i + 7;
				break;
			}
		}
		int session_index = -1;
		if (cookie_index != -1) { 	// If "Cookie:" found...
			for (int i = cookie_index; i < b_len - 9; i++) {
				if (tolower(b[i]) == 's' && tolower(b[i + 1]) == 'e' && tolower(b[i + 2]) == 's' && tolower(b[i + 3]) == 's' && 
					tolower(b[i + 4]) == '_' && tolower(b[i + 5]) == 'i' && tolower(b[i + 6]) == 'd' && b[i + 7] == '=') {
					session_index = i + 8;
					break;
				}
			}
		}
		int session_ending_index = -1;
		if (session_index != -1) {
			for (int i = session_index; i < b_len; i++) {
				if (b[i] == ' ' || b[i] == ';' || b[i] == ',' || b[i] == '\r' || b[i] == '\n') {
					session_ending_index = i - 1;
					break;
				}
			}
		}

		int l = session_ending_index - session_index + 1;
		if (l > 0) {
			if( l > sess_id_buf_size ) {
				l = sess_id_buf_size;
			}
			for ( int i = 0 ; i < l ; i++) {
				sess_id_buf[i] = b[session_index + i];
			}
			r = true;
			sess_id_buf[l] = '\x0';
		}

		return r;
	}


	int auth_logout(char *b) {
		int r = 0;
		char sess_id_buf[ _sess_id_size+1 ];

		if( get_session_id_from_cookie(b, sess_id_buf, _sess_id_size) ) {
			r = auth_delete(sess_id_buf);
		}
		//if (r != nullptr) { std::cerr << "sess=" << _sess_id << std::endl; }
		//else { std::cerr << "sess=nullptr" << std::endl; }
		return r;
	}


	char *auth_confirm(char *b, bool bUpdateSession) {
		char *r = nullptr;
		char sess_id_buf[ _sess_id_size+1 ];

		if( get_session_id_from_cookie(b, sess_id_buf, _sess_id_size) ) {
//cerr << "Session id from cookie: " << _sess_id << endl;
			if (auth_confirm_and_update(sess_id_buf, bUpdateSession) >= 0) {
				r = _sess_id;
			}
		}
		//if (r != nullptr) { std::cerr << "sess=" << _sess_id << std::endl; }
		//else { std::cerr << "sess=nullptr" << std::endl; }
		return r;
	}


	char *auth_do(char *b, char *users_and_passwords[]) {
		char *r = nullptr;
		
		const int user_max_size=100;
		char user[user_max_size+1];
		const int pass_max_size=40;
		char pass[pass_max_size+1];

		int b_len = strlen(b);
		// TO DO:
		// 1. Find user= and password=
		// 2. If found and confirmed: create new session id, then call auth_create with this new session id
		//int status = 0;
		
		user[0] = '\x0';
		int user_index = -1;
		for( int i = 0 ; i < b_len ; i++ ) {
			if( tolower(b[i]) == 'u' && tolower(b[i+1]) == 's' && tolower(b[i+2]) == 'e' && tolower(b[i+3]) == 'r' && tolower(b[i+4]) == '=' ) {
				user_index = i+5;
				break;
			}
		}		
		if( user_index != -1 ) {
			int user_i = 0;
			for( int i = user_index ; i < b_len && user_i < user_max_size ; i++ ) {
				if( b[i] == '&' || b[i] == ' ' || b[i] == '\r' || b[i] == '\n' ) {
					break;
				}
				user[user_i] = b[i];
				user_i++;
			}
			user[user_i]='\x0';
		}
		pass[0] = '\x0';
		int pass_index = -1;
		for( int i = 0 ; i < b_len ; i++ ) {
			if( tolower(b[i]) == 'p' && tolower(b[i+1]) == 'a' && tolower(b[i+2]) == 's' && tolower(b[i+3]) == 's' && tolower(b[i+4]) == '=' ) {
				pass_index = i+5;
				break;
			}
		}		
		if( pass_index != -1 ) {
			int pass_i = 0;
			for( int i = pass_index ; i < b_len && pass_i < pass_max_size ; i++ ) {
				if( b[i] == '&' || b[i] == ' ' || b[i] == '\r' || b[i] == '\n' ) {
					break;
				}
				pass[pass_i] = b[i];
				pass_i++;
			}
			pass[pass_i]='\x0';
		}
		
		bool pass_ok = false;
		for( int i = 0 ; users_and_passwords[i] != nullptr ; i+=2 ) {
			if( !( strcmp(users_and_passwords[i], user ) == 0) ) {
				continue;
			}
			if( !( strcmp(users_and_passwords[i+1], pass ) == 0) ) {
				continue;
			}
			if( strlen(user) > _sess_user_name_size ) {
				continue;
			}
			pass_ok = true;
			break;
		}		
		if( pass_ok ) {
			// Calculating and storing session id
			stringstream ss;
			ss << timeSinceEpochMillisec << user;
			cerr << ss.str() << endl;
			string sha2_buf = sha2(ss.str());
			int status = auth_create( sha2_buf.c_str(), user );
			if (status >= 0) {
				r = _sess_id;
			}
		}
		return r;
	}
