# Home Manager module for toolbox.
#
# Usage:
#   imports = [ inputs.toolbox.homeManagerModules.default ];
#   programs.toolbox = {
#     enable = true;
#     voiceMemos.enable = true;       # macOS only
#     transcribeAudio.enable = true;
#   };
#
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
  imports = [
    (import ./hm-modules/voice-memos.nix { inherit self; })
    (import ./hm-modules/transcribe-audio.nix { inherit self; })
  ];

  options.programs.toolbox = {
    enable = lib.mkEnableOption "toolbox CLI utilities";
  };

  config = lib.mkIf cfg.enable {
    # Individual tools are enabled via their own options.
  };
}
