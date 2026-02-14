#!/bin/bash

# Build SCORM packages for Obsero courses
# Usage: ./build-scorm.sh [course-id] or ./build-scorm.sh --all

COURSES_DIR="$(dirname "$0")/../courses"
OUTPUT_DIR="$(dirname "$0")/../dist/scorm"

mkdir -p "$OUTPUT_DIR"

build_course() {
    local course_id=$1
    local course_dir="$COURSES_DIR/$course_id"
    
    if [ ! -d "$course_dir" ]; then
        echo "Error: Course not found: $course_id"
        return 1
    fi
    
    if [ ! -f "$course_dir/imsmanifest.xml" ]; then
        echo "Error: No imsmanifest.xml found in $course_id"
        return 1
    fi
    
    echo "Building SCORM package for: $course_id"
    
    # Create zip file
    local output_file="$OUTPUT_DIR/${course_id}.zip"
    (cd "$course_dir" && zip -r "$output_file" . -x "*.md" -x "*.git*" -x "*.DS_Store")
    
    echo "Created: $output_file"
    echo "Size: $(du -h "$output_file" | cut -f1)"
    echo ""
}

if [ "$1" == "--all" ]; then
    echo "Building all SCORM packages..."
    echo ""
    for course_dir in "$COURSES_DIR"/*/; do
        course_id=$(basename "$course_dir")
        build_course "$course_id"
    done
    echo "Done! All packages in: $OUTPUT_DIR"
elif [ -n "$1" ]; then
    build_course "$1"
else
    echo "Usage: $0 [course-id] or $0 --all"
    echo ""
    echo "Available courses:"
    for course_dir in "$COURSES_DIR"/*/; do
        course_id=$(basename "$course_dir")
        echo "  - $course_id"
    done
fi
