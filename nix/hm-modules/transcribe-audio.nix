# Home Manager module for transcribe-audio.
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
  options.programs.toolbox.transcribeAudio = {
    enable = lib.mkEnableOption "transcribe-audio - transcribe audio files using Whisper";
  };

  config = lib.mkIf (cfg.enable && cfg.transcribeAudio.enable) {
    home.packages = lib.optional (toolPackages ? transcribe-audio) toolPackages.transcribe-audio;
  };
}
