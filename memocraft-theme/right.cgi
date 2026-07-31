#!/usr/bin/perl
use strict;
use warnings;
no warnings 'redefine';
no warnings 'uninitialized';
require "gray-theme/gray-theme-lib.pl";
require "gray-theme/theme.pl";
&ReadParse();
&load_theme_library();

&redirect('/memocraft-theme/memo-dashboard.cgi');
exit;

# Compatibility anchor used by build.sh. This block never executes.
if (0) {
my $prehead = "";
&popup_header(undef, $prehead);
}
