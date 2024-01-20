#!/bin/bash

new_tag=$1

# Create the new tag
git tag -a "$new_tag" -m "Version $new_tag"

# Push the new tag to remote
git push origin "$new_tag"