# Build packages from pre-built binaries hosted on GitHub Releases.
# Reads hashes from nix/hashes.json (updated by the release workflow).
{
  pkgs,
  hashes,
  owner ? "aliou",
  repo ? "toolbox",
}:

let
  lib = pkgs.lib;
  system = pkgs.system;

  nixToBinaryPlatform = {
    "aarch64-darwin" = "darwin-arm64";
    "x86_64-darwin" = "darwin-x64";
    "aarch64-linux" = "linux-arm64";
    "x86_64-linux" = "linux-x64";
  };

  mkTool =
    {
      pname,
      runtimeDeps ? [ ],
    }:
    let
      toolInfo = hashes.${pname} or null;
      hash = if toolInfo != null then (toolInfo.hashes.${system} or null) else null;
      binaryPlatform = nixToBinaryPlatform.${system} or null;
      binaryName = "${pname}-${binaryPlatform}";
    in
    if toolInfo == null || hash == null || binaryPlatform == null then
      null
    else
      pkgs.stdenv.mkDerivation {
        inherit pname;
        version = toolInfo.version;

        src = pkgs.fetchurl {
          url = "https://github.com/${owner}/${repo}/releases/download/${pname}@${toolInfo.version}/${binaryName}";
          inherit hash;
        };

        dontUnpack = true;

        nativeBuildInputs = lib.optionals (runtimeDeps != [ ]) [ pkgs.makeWrapper ];

        installPhase =
          ''
            install -D -m755 $src $out/bin/${pname}
          ''
          + lib.optionalString (runtimeDeps != [ ]) ''
            wrapProgram $out/bin/${pname} \
              --prefix PATH : ${lib.makeBinPath runtimeDeps}
          '';
      };

in
lib.filterAttrs (_: v: v != null) {
  voice-memos = mkTool { pname = "voice-memos"; };
  transcribe-audio = mkTool {
    pname = "transcribe-audio";
    runtimeDeps = [
      pkgs.ffmpeg
      pkgs.whisper-cpp
    ];
  };
}
