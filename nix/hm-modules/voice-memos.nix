# Home Manager module for voice-memos (macOS only).
{ self }:
{
  config,
  lib,
  pkgs,
  ...
}:
let
  cfg = config.programs.toolbox;
  toolPackages = self.packages.${pkgs.system};
in
{
  options.programs.toolbox.voiceMemos = {
    enable = lib.mkEnableOption "voice-memos - list and select Apple Voice Memos";
  };

  config = lib.mkIf (cfg.enable && cfg.voiceMemos.enable) {
    assertions = [
      {
        assertion = pkgs.stdenv.isDarwin;
        message = "voice-memos is only available on macOS";
      }
    ];

    home.packages = lib.optional (toolPackages ? voice-memos) toolPackages.voice-memos;
  };
}
