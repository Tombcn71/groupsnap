-- Add test data to see members with uploaded photos

-- First, let's see what groups exist
SELECT 'Current groups:' as info;
SELECT id, name, description, created_by FROM groups;

-- Let's use the first group (or create one if none exist)
DO $$
DECLARE
    test_group_id uuid;
    test_user_id uuid := 'b01702a9-44f9-485a-81d1-2f3cdc3397c4'; -- Replace with your user ID
BEGIN
    -- Get the first group ID or create one
    SELECT id INTO test_group_id FROM groups LIMIT 1;
    
    IF test_group_id IS NULL THEN
        -- Create a test group
        INSERT INTO groups (id, name, description, created_by) 
        VALUES (gen_random_uuid(), 'Test Groep', 'Test groep voor debugging', test_user_id)
        RETURNING id INTO test_group_id;
    END IF;

    -- Add some test members to the group
    INSERT INTO group_members (group_id, email, status, invited_at) VALUES
    (test_group_id, 'test1@example.com', 'invited', NOW()),
    (test_group_id, 'test2@example.com', 'invited', NOW()),
    (test_group_id, 'test3@example.com', 'invited', NOW())
    ON CONFLICT (group_id, email) DO NOTHING;

    -- Add some test photos for these members
    INSERT INTO member_photos (group_id, email, image_url, uploaded_at) VALUES
    (test_group_id, 'test1@example.com', 'https://via.placeholder.com/150x150/ff6b6b/ffffff?text=User+1', NOW()),
    (test_group_id, 'test2@example.com', 'https://via.placeholder.com/150x150/4ecdc4/ffffff?text=User+2', NOW())
    ON CONFLICT (group_id, email) DO UPDATE SET 
        image_url = EXCLUDED.image_url,
        uploaded_at = EXCLUDED.uploaded_at;

    -- Show results
    RAISE NOTICE 'Test group ID: %', test_group_id;
    
END $$;

-- Show final results
SELECT 'Members in test group:' as info;
SELECT gm.email, gm.status, 
       CASE WHEN mp.email IS NOT NULL THEN 'HAS PHOTO ✅' ELSE 'NO PHOTO ❌' END as photo_status
FROM group_members gm
LEFT JOIN member_photos mp ON gm.group_id = mp.group_id AND gm.email = mp.email
WHERE gm.group_id = (SELECT id FROM groups LIMIT 1)
ORDER BY gm.email;

SELECT 'Group ID to test with:' as info, id as group_id FROM groups LIMIT 1;
