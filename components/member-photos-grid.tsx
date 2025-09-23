import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Camera, User } from "lucide-react"

interface MemberPhotosGridProps {
  members: any[]
}

export function MemberPhotosGrid({ members }: MemberPhotosGridProps) {
  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Member Photos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {members.map((member) => {
              const hasPhoto = member.member_photos && member.member_photos.length > 0
              const photo = hasPhoto ? member.member_photos[0] : null

              return (
                <div key={member.id} className="space-y-3">
                  <div className="aspect-square relative overflow-hidden rounded-lg border-2 border-border bg-muted">
                    {photo ? (
                      <img
                        src={photo.image_url || "/placeholder.svg"}
                        alt={member.profiles?.full_name || member.profiles?.email}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-sm truncate">
                      {member.profiles?.full_name || member.profiles?.email}
                    </p>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant={hasPhoto ? "default" : "secondary"}
                        className={hasPhoto ? "bg-green-500/20 text-green-400 border-green-500/30" : ""}
                      >
                        {hasPhoto ? (
                          <>
                            <Camera className="h-3 w-3 mr-1" />
                            Uploaded
                          </>
                        ) : (
                          "Pending"
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No members yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
