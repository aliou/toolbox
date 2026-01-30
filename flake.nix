{
  description = "CLI toolbox - pre-built binaries via GitHub Releases";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/master";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    {
      self,
      nixpkgs,
      flake-utils,
    }:
    (flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };
        hashes = builtins.fromJSON (builtins.readFile ./nix/hashes.json);
      in
      {
        packages = import ./nix/mk-packages.nix {
          inherit pkgs hashes;
        };

        devShells.default = pkgs.mkShell {
          buildInputs =
            [
              pkgs.bun
              pkgs.ffmpeg
              pkgs.whisper-cpp
            ]
            ++ pkgs.lib.optionals pkgs.stdenv.isDarwin [
              # None needed currently, but placeholder for future darwin-only deps.
            ];
        };
      }
    ))
    // {
      homeManagerModules = {
        default = import ./nix/hm-module.nix { inherit self; };
      };
    };
}
