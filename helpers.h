#pragma once

#ifndef __HELPERS_H
#define __HELPERS_H

#define MIME_BUF_SIZE 80
void mimeSetType(char *fn, char *mime_buf, int mime_buf_size);

int getUriToServe(char *b, char *uri_buf, int uri_buf_size, char **get, char **post);

bool is_html_request( char *uri );

#endif
