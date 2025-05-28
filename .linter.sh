#!/bin/bash
cd /home/kavia/workspace/code-generation/rapidstrike-immersive-fps-24317-a23bcf2d/rapidstrike_fps
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

