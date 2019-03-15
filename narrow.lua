local infile = io.open('ygodeck.css','r')
local outfile = io.open('narrow.css','w')
local ratio = 7/10
assert(infile and outfile)

local content = infile:read('*a')
infile:close()

for tag, rules in content:gmatch('([^\n\r]+)%s+({[^}]+})') do
    local hadTag = false
    for rule in rules:gmatch('[^\n\r]+') do
        local c
        rule, c = rule:gsub('([0-9%-%.]+)vh', function(a)
            return ('%.2fvw'):format(a*ratio)
        end)
        if c > 0 then
            if not hadTag then
                outfile:write(tag);
                outfile:write("\n{\n");
                hadTag = true
            end
            outfile:write(rule)
            outfile:write("\n")
        end
    end
    if hadTag then
        outfile:write("}\n")
    end
end
outfile:close()