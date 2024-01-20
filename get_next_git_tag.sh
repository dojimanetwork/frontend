#!/bin/bash

INCREMENT_TYPE=$1

# Fetch tags from the remote repository
git fetch --tags

# Get the latest tag
latest_tag=$(git describe --tags --abbrev=0)

# Split the version into major, minor, and patch parts
IFS='.' read -r -a parts <<< "$latest_tag"
major=${parts[0]}
minor=${parts[1]}
patch=${parts[2]}

# Increment the version based on the provided type
case "$INCREMENT_TYPE" in
    major)
        ((major++))
        minor=0
        patch=0
        ;;
    minor)
        ((minor++))
        patch=0
        ;;
    patch)
        ((patch++))
        ;;
    *)
        echo "Invalid increment type. Use 'major', 'minor', or 'patch'."
        exit 1
        ;;
esac

new_tag="$major.$minor.$patch"

echo $new_tag